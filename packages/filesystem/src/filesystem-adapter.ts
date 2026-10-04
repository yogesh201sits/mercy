import {
    access,
    mkdir,
    readFile,
    rename,
    rm,
    stat,
    writeFile
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
    PreparedAction,
    UndoResult
} from "@mercy/core";

import {
    MercyError,
    sha256
} from "@mercy/shared";

import type {
    Snapshot,
    SnapshotStore
} from "@mercy/core";

export class FilesystemAdapter implements ActionAdapter {
    readonly name = "filesystem";

    constructor(
        private readonly rootDirectory: string,
        private readonly snapshots: SnapshotStore
    ) {
        this.rootDirectory = resolve(rootDirectory);
    }

    canHandle(input: ActionInput): boolean {
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
                "ADAPTER_NOT_FOUND",
                `Filesystem adapter cannot handle action type: ${input.type}`
            );
        }

        const actionId = input.metadata?.actionId;

        if (typeof actionId !== "string") {
            throw new MercyError(
                "INVALID_INPUT",
                "Filesystem action requires an actionId"
            );
        }

        // Validate the target before creating a prepared action.
        this.resolveTarget(input.target);

        if (
            input.type === "rename" ||
            input.type === "move"
        ) {
            const destination =
                input.metadata?.destination;

            if (typeof destination !== "string") {
                throw new MercyError(
                    "INVALID_INPUT",
                    "Filesystem rename/move requires metadata.destination"
                );
            }

            this.resolveTarget(destination);
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
                ? { metadata: input.metadata }
                : {})
        };
    }

    async snapshot(
        action: PreparedAction
    ): Promise<Snapshot> {
        const path = this.resolveTarget(
            action.input.target
        );

        const exists = await this.exists(path);

        if (!exists) {
            return this.snapshots.create({
                actionId: action.actionId,
                data: new Uint8Array(),
                metadata: {
                    exists: false,
                    path: action.input.target
                }
            });
        }

        const fileStat = await stat(path);

        if (!fileStat.isFile()) {
            throw new MercyError(
                "ACTION_FAILED",
                `Filesystem target is not a file: ${action.input.target}`
            );
        }

        const data = await readFile(path);

        return this.snapshots.create({
            actionId: action.actionId,
            data,
            metadata: {
                exists: true,
                path: action.input.target,
                size: data.byteLength,
                mode: fileStat.mode
            }
        });
    }

    async execute(
        action: PreparedAction
    ): Promise<ActionResult> {
        const {
            input
        } = action;

        try {
            switch (input.type) {
                case "create":

                case "update":
                    return await this.write(action);

                case "delete":
                    return await this.delete(action);

                case "rename":
                case "move":
                    return await this.renameOrMove(action);

                default:
                    throw new MercyError(
                        "ACTION_FAILED",
                        `Unsupported filesystem action: ${input.type}`
                    );
            }
        } catch (error) {
            if (error instanceof MercyError) {
                throw error;
            }

            throw new MercyError(
                "ACTION_FAILED",
                `Filesystem action failed: ${input.target}`,
                {
                    cause: error
                }
            );
        }
    }

    async undo(
        action: Action,
        snapshot: Snapshot
    ): Promise<UndoResult> {
        try {
            const verification =
                await this.verify(action);

            if (verification.conflict) {

                return {
                    actionId: action.id,
                    success: false,
                    conflict: true,
                    error: verification.reason ?? ""
                };
            }

            const metadata = snapshot.metadata;

            if (
                metadata?.exists === false
            ) {
                await rm(
                    this.resolveTarget(action.target),
                    {
                        force: true
                    }
                );

                return {
                    actionId: action.id,
                    success: true,
                    conflict: false
                };
            }

            const data =
                await this.snapshots.read(
                    snapshot.id
                );

            await mkdir(
                dirname(
                    this.resolveTarget(action.target)
                ),
                {
                    recursive: true
                }
            );

            await writeFile(
                this.resolveTarget(action.target),
                data
            );

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
                        : "Filesystem undo failed"
            };
        }
    }

    async verify(
        action: Action
    ) {
        const path = this.resolveTarget(
            action.target
        );

        const exists = await this.exists(path);

        if (!action.afterHash) {
            return {
                valid: exists,
                conflict: false
            };
        }

        if (!exists) {
            return {
                valid: false,
                conflict: true,
                reason:
                    "Filesystem target no longer exists"
            };
        }

        const data = await readFile(path);

        const currentHash =
            await sha256(data);

        if (
            currentHash !== action.afterHash
        ) {
            return {
                valid: false,
                conflict: true,
                reason:
                    "Filesystem target changed after the action"
            };
        }

        return {
            valid: true,
            conflict: false
        };
    }

    private async write(
        action: PreparedAction
    ): Promise<ActionResult> {
        const {
            input
        } = action;

        const content =
            input.metadata?.content;

        if (typeof content !== "string") {
            throw new MercyError(
                "INVALID_INPUT",
                "Filesystem write requires metadata.content"
            );
        }

        const path =
            this.resolveTarget(input.target);

        await mkdir(dirname(path), {
            recursive: true
        });

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
            actionId: action.actionId,
            success: true,
            result: {
                path: input.target,
                size: data.byteLength,
                afterHash
            }
        };
    }

    private async delete(
        action: PreparedAction
    ): Promise<ActionResult> {
        const path =
            this.resolveTarget(
                action.input.target
            );

        await rm(path, {
            force: true
        });

        return {
            actionId: action.actionId,
            success: true,
            result: {
                path: action.input.target
            }
        };
    }

    private async renameOrMove(
        action: PreparedAction
    ): Promise<ActionResult> {
        const input = action.input;

        const destination =
            input.metadata?.destination;

        if (typeof destination !== "string") {
            throw new MercyError(
                "INVALID_INPUT",
                "Filesystem rename/move requires metadata.destination"
            );
        }

        const source =
            this.resolveTarget(input.target);

        const target =
            this.resolveTarget(destination);

        await mkdir(dirname(target), {
            recursive: true
        });

        await rename(source, target);

        const data =
            await readFile(target);

        const afterHash =
            await sha256(data);

        return {
            actionId: action.actionId,
            success: true,
            result: {
                source: input.target,
                destination,
                afterHash
            }
        };
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

        const resolved =
            resolve(
                this.rootDirectory,
                target
            );

        const relativePath =
            relative(
                this.rootDirectory,
                resolved
            );

        if (
            relativePath === "" ||
            relativePath.startsWith("..") ||
            isAbsolute(relativePath)
        ) {
            throw new MercyError(
                "INVALID_INPUT",
                "Filesystem target escapes the project directory"
            );
        }

        return resolved;
    }

    private async exists(
        path: string
    ): Promise<boolean> {
        try {
            await access(path);
            return true;
        } catch {
            return false;
        }
    }

    private getActionId(
        action: PreparedAction
    ): string {
        const actionId =
            action.metadata?.actionId;

        if (
            typeof actionId !== "string"
        ) {
            throw new MercyError(
                "INVALID_INPUT",
                "Prepared filesystem action requires metadata.actionId"
            );
        }

        return actionId;
    }
}