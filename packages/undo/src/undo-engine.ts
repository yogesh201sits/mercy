import type { SnapshotStore } from "@mercy/core";
import { MercyError } from "@mercy/shared";

import type {
  ActionAdapter,
  UndoResult,
} from "@mercy/core";

import type {
  ActionJournal,
  JournalEntry,
} from "@mercy/journal";

export interface UndoEngineOptions {
  readonly journal: ActionJournal;
  readonly snapshots: SnapshotStore;
  readonly adapters: readonly ActionAdapter[];
}

export class UndoEngine {
  private readonly journal: ActionJournal;
  private readonly snapshots: SnapshotStore;
  private readonly adapters: readonly ActionAdapter[];

  constructor(options: UndoEngineOptions) {
    this.journal = options.journal;
    this.snapshots = options.snapshots;
    this.adapters = options.adapters;
  }

  async undo(actionId: string): Promise<UndoResult> {
    const action = await this.getAction(actionId);

    if (action.status === "undone") {
      return (
        action.undoResult ?? {
          actionId,
          success: true,
          conflict: false,
        }
      );
    }

    if (!action.beforeSnapshotId) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `No snapshot exists for action: ${actionId}`
      );
    }

    const adapter = this.findAdapter(action);

    await this.journal.markUndoing(actionId);

    try {
      const verification = await adapter.verify(action);

      if (verification.conflict) {
        const result: UndoResult = {
          actionId,
          success: false,
          conflict: true,
          ...(verification.reason
            ? { error: verification.reason }
            : {}),
        };

        await this.journal.markUndoFailed(
          actionId,
          result
        );

        return result;
      }

      const snapshot = await this.snapshots.get(
        action.beforeSnapshotId
      );

      if (!snapshot) {
        throw new MercyError(
          "SNAPSHOT_NOT_FOUND",
          `Snapshot not found: ${action.beforeSnapshotId}`
        );
      }

      const data = await this.snapshots.read(snapshot.id);

      const result = await adapter.undo(
        action,
        snapshot,
        data
      );

      if (!result.success) {
        await this.journal.markUndoFailed(
          actionId,
          result
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
        error instanceof Error
          ? error.message
          : String(error);

      const failedResult: UndoResult = {
        actionId,
        success: false,
        conflict: false,
        error: message
      };

      await this.journal.markUndoFailed(
        actionId,
        failedResult
      );

      throw error;
    }
  }

  private async getAction(
    actionId: string
  ): Promise<JournalEntry> {
    const action = await this.journal.get(actionId);

    if (!action) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action not found: ${actionId}`
      );
    }

    return action;
  }

  private findAdapter(
    action: JournalEntry
  ): ActionAdapter {
    const adapter = this.adapters.find((candidate) =>
      candidate.canHandle({
        projectId: action.projectId,
        type: action.type,
        target: action.target,
        ...(action.metadata
          ? { metadata: action.metadata }
          : {}),
      })
    );

    if (!adapter) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `No adapter found for action: ${action.id}`
      );
    }

    return adapter;
  }
}