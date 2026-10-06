import {
  readFile,
  rename,
  rm,
  stat,
  writeFile,
  chmod
} from "node:fs/promises";

import {
  dirname,
  isAbsolute,
  relative,
  resolve
} from "node:path";

import type {
  Action,
  ActionAdapter,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult
} from "@mercy/core";

import { MercyError, sha256 } from "@mercy/shared";

export class FilesystemAdapter
  implements ActionAdapter
{
  readonly name = "filesystem";

  constructor(
    private readonly rootDirectory: string
  ) {}

  canHandle(
    input: ActionInput
  ): boolean {
    return [
      "create",
      "update",
      "delete",
      "rename",
      "move"
    ].includes(input.type);
  }

  async prepare(
    input: ActionInput
  ): Promise<PreparedAction> {
    if (!this.canHandle(input)) {
      throw new MercyError(
        "INVALID_INPUT",
        `Unsupported filesystem action: ${input.type}`
      );
    }

    const actionId =
      input.metadata?.actionId;

    if (
      typeof actionId !== "string" ||
      actionId.length === 0
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "Filesystem action requires metadata.actionId"
      );
    }

    this.resolveTarget(
      input.target
    );

    if (
      input.type === "rename" ||
      input.type === "move"
    ) {
      const destination =
        input.metadata?.destination;

      if (
        typeof destination !== "string" ||
        destination.length === 0
      ) {
        throw new MercyError(
          "INVALID_INPUT",
          `${input.type} requires metadata.destination`
        );
      }

      this.resolveTarget(
        destination
      );
    }

    return {
      actionId,
      input,
      undoStrategy:
        input.type === "rename" ||
        input.type === "move"
          ? "reverse"
          : "restore",
      ...(input.metadata
        ? {
            metadata:
              input.metadata
          }
        : {})
    };
  }

  async snapshot(
    action: PreparedAction
  ): Promise<CapturedState> {
    const path =
      this.resolveTarget(
        action.input.target
      );

    try {
      const fileStat =
        await stat(path);

      if (!fileStat.isFile()) {
        throw new MercyError(
          "INVALID_INPUT",
          `Target is not a file: ${action.input.target}`
        );
      }

      const data =
        await readFile(path);

      return {
        data,
        metadata: {
          exists: true,
          path: action.input.target,
          size: fileStat.size,
          mode: fileStat.mode
        }
      };
    } catch (error) {
      if (
        error instanceof MercyError
      ) {
        throw error;
      }

      if (
        this.isNotFoundError(error)
      ) {
        return {
          data: new Uint8Array(),
          metadata: {
            exists: false,
            path: action.input.target
          }
        };
      }

      throw new MercyError(
        "SNAPSHOT_FAILED",
        `Failed to snapshot: ${action.input.target}`,
        { cause: error }
      );
    }
  }

  async execute(
    action: PreparedAction
  ): Promise<ActionResult> {
    const {
      input,
      actionId
    } = action;

    try {
      switch (input.type) {
        case "create":
        case "update": {
          const content =
            input.metadata?.content;

          if (
            typeof content !== "string"
          ) {
            throw new MercyError(
              "INVALID_INPUT",
              `${input.type} requires metadata.content`
            );
          }

          const path =
            this.resolveTarget(
              input.target
            );

          await writeFile(
            path,
            content,
            "utf8"
          );

          const data =
            await readFile(path);

          const afterHash =
            await sha256(data);

          return {
            actionId,
            success: true,
            afterHash,
            result: {
              path: input.target,
              size: data.byteLength
            }
          };
        }

        case "delete": {
          const path =
            this.resolveTarget(
              input.target
            );

          await rm(path);

          return {
            actionId,
            success: true,
            result: {
              path: input.target
            }
          };
        }

        case "rename":
        case "move": {
          const destination =
            input.metadata?.destination;

          if (
            typeof destination !== "string"
          ) {
            throw new MercyError(
              "INVALID_INPUT",
              `${input.type} requires metadata.destination`
            );
          }

          const sourcePath =
            this.resolveTarget(
              input.target
            );

          const destinationPath =
            this.resolveTarget(
              destination
            );

          await mkdirParent(
            destinationPath
          );

          await rename(
            sourcePath,
            destinationPath
          );

          const data =
            await readFile(
              destinationPath
            );

          const afterHash =
            await sha256(data);

          return {
            actionId,
            success: true,
            afterHash,
            result: {
              source: input.target,
              destination
            }
          };
        }

        default:
          throw new MercyError(
            "INVALID_INPUT",
            `Unsupported filesystem action: ${input.type}`
          );
      }
    } catch (error) {
      if (
        error instanceof MercyError
      ) {
        throw error;
      }

      throw new MercyError(
        "ACTION_FAILED",
        `Filesystem action failed: ${input.target}`,
        { cause: error }
      );
    }
  }

  async undo(
    action: Action,
    snapshot: Snapshot,
    data: Uint8Array
  ): Promise<UndoResult> {
    const verification =
      await this.verify(action);

    if (verification.conflict) {
      return {
        actionId: action.id,
        success: false,
        conflict: true,
        ...(verification.reason
          ? {
              error:
                verification.reason
            }
          : {})
      };
    }

    try {
      /*
       * Rename / move are reversed by moving
       * the destination back to the original path.
       */
      if (
        action.type === "rename" ||
        action.type === "move"
      ) {
        const destination =
          action.metadata?.destination;

        if (
          typeof destination !== "string" ||
          destination.length === 0
        ) {
          return {
            actionId: action.id,
            success: false,
            conflict: false,
            error:
              `${action.type} requires metadata.destination`
          };
        }

        const sourcePath =
          this.resolveTarget(
            action.target
          );

        const destinationPath =
          this.resolveTarget(
            destination
          );

        /*
         * The original path must not have been
         * recreated after the action. Otherwise
         * reversing the move could overwrite it.
         */
        if (
          await this.exists(sourcePath)
        ) {
          return {
            actionId: action.id,
            success: false,
            conflict: true,
            error:
              "Original resource already exists. Refusing to overwrite it during undo."
          };
        }

        /*
         * Reverse the original rename/move.
         */
        await mkdirParent(
          sourcePath
        );

        await rename(
          destinationPath,
          sourcePath
        );

        return {
          actionId: action.id,
          success: true,
          conflict: false
        };
      }

      const metadata =
        snapshot.metadata;

      const exists =
        metadata?.exists === true;

      const originalPath =
        typeof metadata?.path === "string"
          ? metadata.path
          : action.target;

      const path =
        this.resolveTarget(
          originalPath
        );

      if (!exists) {
        await rm(path, {
          force: true
        });
      } else {
        await mkdirParent(path);

        await writeFile(
          path,
          data
        );

        const mode =
          metadata?.mode;

        if (
          typeof mode === "number"
        ) {
          await chmod(
            path,
            mode
          );
        }
      }

      return {
        actionId: action.id,
        success: true,
        conflict: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        conflict: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  async verify(
    action: Action
  ) {
    if (!action.afterHash) {
      return {
        valid: true,
        conflict: false
      };
    }

    /*
     * create/update:
     *   verify action.target
     *
     * rename/move:
     *   verify destination because the
     *   resource now lives there.
     */
    const target =
      action.type === "rename" ||
      action.type === "move"
        ? action.metadata?.destination
        : action.target;

    if (
      typeof target !== "string" ||
      target.length === 0
    ) {
      return {
        valid: false,
        conflict: true,
        reason:
          "Unable to determine resource location for verification."
      };
    }

    const path =
      this.resolveTarget(
        target
      );

    try {
      const data =
        await readFile(path);

      const currentHash =
        await sha256(data);

      if (
        currentHash !==
        action.afterHash
      ) {
        return {
          valid: false,
          conflict: true,
          reason:
            "Resource changed after the action completed."
        };
      }

      return {
        valid: true,
        conflict: false
      };
    } catch (error) {
      if (
        this.isNotFoundError(error)
      ) {
        return {
          valid: false,
          conflict: true,
          reason:
            "Resource no longer exists."
        };
      }

      throw error;
    }
  }

  private async exists(
    path: string
  ): Promise<boolean> {
    try {
      await stat(path);

      return true;
    } catch (error) {
      if (
        this.isNotFoundError(error)
      ) {
        return false;
      }

      throw error;
    }
  }

  private resolveTarget(
    target: string
  ): string {
    if (isAbsolute(target)) {
      throw new MercyError(
        "INVALID_INPUT",
        "Filesystem target must be relative"
      );
    }

    const root =
      resolve(this.rootDirectory);

    const resolved =
      resolve(root, target);

    const relativePath =
      relative(
        root,
        resolved
      );

    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "Filesystem target escapes the root directory"
      );
    }

    return resolved;
  }

  private isNotFoundError(
    error: unknown
  ): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    );
  }
}

async function mkdirParent(
  path: string
): Promise<void> {
  await import("node:fs/promises").then(
    ({ mkdir }) =>
      mkdir(dirname(path), {
        recursive: true
      })
  );
}
