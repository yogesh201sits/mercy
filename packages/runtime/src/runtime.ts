import type {
  Action,
  ActionAdapter,
  ActionInput,
  ActionResult,
  UndoResult
} from "@mercy/core";
import type {
  ActionJournal
} from "@mercy/journal";
import {
  MercyError,
  createId
} from "@mercy/shared";
import type {
  SnapshotStore
} from "@mercy/core";

export interface MercyRuntimeOptions {
  readonly journal: ActionJournal;
  readonly snapshots: SnapshotStore;
  readonly adapters: readonly ActionAdapter[];
}

export class MercyRuntime {
  private readonly journal: ActionJournal;
  private readonly snapshots: SnapshotStore;
  private readonly adapters: readonly ActionAdapter[];

  constructor(
    options: MercyRuntimeOptions
  ) {
    this.journal = options.journal;
    this.snapshots =
      options.snapshots;
    this.adapters =
      options.adapters;
  }

  async execute(
    input: ActionInput
  ): Promise<ActionResult> {
    const adapter =
      this.findAdapter(input);

    const actionId = createId();

    const preparedInput: ActionInput = {
      ...input,
      metadata: {
        ...(input.metadata ?? {}),
        actionId
      }
    };

    await this.journal.create({
      id: actionId,
      input: preparedInput,
      undoStrategy:
        this.getUndoStrategy(input)
    });

    try {
      const prepared =
        await adapter.prepare(
          preparedInput
        );

      const captured =
        await adapter.snapshot(
          prepared
        );

      const snapshot =
        await this.snapshots.create({
          actionId,
          data: captured.data,
          ...(captured.metadata
            ? {
                metadata:
                  captured.metadata
              }
            : {})
        });

      await this.journal
        .markSnapshotCreated(
          actionId,
          snapshot.id
        );

      await this.journal.markRunning(
        actionId
      );

      const result =
        await adapter.execute(
          prepared
        );

      if (!result.success) {
        await this.journal.markFailed(
          actionId,
          result.error ??
            "Action execution failed"
        );

        return result;
      }

      await this.journal.markCompleted(
        actionId,
        result,
        result.afterHash
      );

      return result;
    } catch (error) {
      const message =
        this.getErrorMessage(error);

      await this.journal.markFailed(
        actionId,
        message
      );

      throw error;
    }
  }

  async undo(
    actionId: string
  ): Promise<UndoResult> {
    const action =
      await this.journal.get(
        actionId
      );

    if (!action) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action not found: ${actionId}`
      );
    }

    if (action.status === "undone") {
      return (
        action.undoResult ?? {
          actionId,
          success: true,
          conflict: false
        }
      );
    }

    if (!action.beforeSnapshotId) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `No snapshot exists for action: ${actionId}`
      );
    }

    const adapter =
      this.findAdapterForAction(
        action
      );

    await this.journal.markUndoing(
      actionId
    );

    try {
      const verification =
        await adapter.verify(action);

      if (verification.conflict) {
        const result: UndoResult = {
          actionId,
          success: false,
          conflict: true,
          ...(verification.reason
            ? {
                error:
                  verification.reason
              }
            : {})
        };

        await this.journal.markUndoFailed(
          actionId,
          verification.reason ??
            "Action cannot be undone because the resource changed."
        );

        return result;
      }

      const snapshot =
        await this.snapshots.get(
          action.beforeSnapshotId
        );

      if (!snapshot) {
        throw new MercyError(
          "SNAPSHOT_NOT_FOUND",
          `Snapshot not found: ${action.beforeSnapshotId}`
        );
      }

      const data =
        await this.snapshots.read(
          snapshot.id
        );

      const result =
        await adapter.undo(
          action,
          snapshot,
          data
        );

      if (!result.success) {
        await this.journal.markUndoFailed(
          actionId,
          result.error ??
            "Undo failed"
        );

        return result;
      }

      await this.journal.markUndone(
        actionId,
        result
      );

      return result;
    } catch (error) {
      const message =
        this.getErrorMessage(error);

      await this.journal.markUndoFailed(
        actionId,
        message
      );

      throw error;
    }
  }

  async getAction(
    actionId: string
  ) {
    return this.journal.get(
      actionId
    );
  }

  async listActions(
    projectId: string
  ) {
    return this.journal.list(
      projectId
    );
  }

  private findAdapter(
    input: ActionInput
  ): ActionAdapter {
    const adapter =
      this.adapters.find(
        (candidate) =>
          candidate.canHandle(input)
      );

    if (!adapter) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `No adapter can handle action: ${input.type}`
      );
    }

    return adapter;
  }

  private findAdapterForAction(
    action: Action
  ): ActionAdapter {
    const adapter =
      this.adapters.find(
        (candidate) =>
          candidate.canHandle({
            projectId:
              action.projectId,
            type: action.type,
            target: action.target
          })
      );

    if (!adapter) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `No adapter can handle action: ${action.type}`
      );
    }

    return adapter;
  }

  private getUndoStrategy(
    input: ActionInput
  ): Action["undoStrategy"] {
    switch (input.type) {
      case "create":
      case "update":
      case "delete":
        return "restore";

      case "rename":
      case "move":
        return "reverse";

      default:
        return "compensate";
    }
  }

  private getErrorMessage(
    error: unknown
  ): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}