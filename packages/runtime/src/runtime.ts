import type {
  Action,
  ActionAdapter,
  ActionGroup,
  ActionGroupInput,
  ActionInput,
  ActionResult,
  SnapshotStore,
  UndoResult
} from "@mercy/core";
import type {
  ActionGroupJournal,
  ActionJournal
} from "@mercy/journal";
import { MercyError, createId } from "@mercy/shared";
import { UndoEngine } from "@mercy/undo";

export interface MercyRuntimeOptions {
  readonly journal: ActionJournal;
  readonly groupJournal: ActionGroupJournal;
  readonly snapshots: SnapshotStore;
  readonly adapters: readonly ActionAdapter[];
}

export class MercyRuntime {
  private readonly journal: ActionJournal;
  private readonly groupJournal: ActionGroupJournal;
  private readonly snapshots: SnapshotStore;
  private readonly adapters: readonly ActionAdapter[];
  private readonly undoEngine: UndoEngine;

  constructor(options: MercyRuntimeOptions) {
    this.journal = options.journal;
    this.groupJournal = options.groupJournal;
    this.snapshots = options.snapshots;
    this.adapters = options.adapters;

    this.undoEngine = new UndoEngine({
      journal: this.journal,
      snapshots: this.snapshots,
      adapters: this.adapters
    });
  }

  async startGroup(
    input: ActionGroupInput
  ): Promise<ActionGroup> {
    return this.groupJournal.create({
      id: createId(),
      projectId: input.projectId
    });
  }

  async execute(
    input: ActionInput,
    groupId?: string
  ): Promise<ActionResult> {
    const adapter = this.findAdapter(input);
    const actionId = createId();

    if (groupId) {
      await this.validateGroup(groupId, input.projectId);
    }

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
      undoStrategy: this.getUndoStrategy(input)
    });

    if (groupId) {
      await this.groupJournal.addAction(
        groupId,
        actionId
      );
    }

    try {
      const prepared = await adapter.prepare(
        preparedInput
      );

      const captured = await adapter.snapshot(
        prepared
      );

      const snapshot = await this.snapshots.create({
        actionId,
        data: captured.data,
        ...(captured.metadata
          ? { metadata: captured.metadata }
          : {})
      });

      await this.journal.markSnapshotCreated(
        actionId,
        snapshot.id
      );

      await this.journal.markRunning(actionId);

      const result = await adapter.execute(
        prepared
      );

      if (!result.success) {
        await this.journal.markFailed(
          actionId,
          result.error ?? "Action execution failed"
        );

        if (groupId) {
          await this.groupJournal.markFailed(
            groupId,
            result.error ?? "Action execution failed"
          );
        }

        return result;
      }

      await this.journal.markCompleted(
        actionId,
        result,
        result.afterHash
      );

      return result;
    } catch (error) {
      const message = this.getErrorMessage(error);

      await this.journal.markFailed(
        actionId,
        message
      );

      if (groupId) {
        await this.groupJournal.markFailed(
          groupId,
          message
        );
      }

      throw error;
    }
  }

  async completeGroup(
    groupId: string
  ): Promise<ActionGroup> {
    const group = await this.getGroup(groupId);

    if (group.status === "completed") {
      return group;
    }

    if (group.status === "failed") {
      throw new MercyError(
        "ACTION_FAILED",
        `Cannot complete failed action group: ${groupId}`
      );
    }

    if (group.actionIds.length === 0) {
      throw new MercyError(
        "INVALID_INPUT",
        `Cannot complete empty action group: ${groupId}`
      );
    }

    return this.groupJournal.markCompleted(
      groupId
    );
  }

  async undo(
    actionId: string
  ): Promise<UndoResult> {
    return this.undoEngine.undo(actionId);
  }

  async undoGroup(
    groupId: string
  ): Promise<import("@mercy/core").GroupUndoResult> {
    const group = await this.getGroup(groupId);

    if (group.status === "undone") {
      return {
        groupId,
        success: true,
        conflict: false,
        results: []
      };
    }

    if (
      group.status !== "completed" &&
      group.status !== "failed"
    ) {
      throw new MercyError(
        "ACTION_FAILED",
        `Action group cannot be undone in its current state: ${group.status}`
      );
    }

    await this.groupJournal.markUndoing(
      groupId
    );

    const results: UndoResult[] = [];

    try {
      for (
        let index = group.actionIds.length - 1;
        index >= 0;
        index -= 1
      ) {
        const actionId = group.actionIds[index];

        if (!actionId) {
          continue;
        }

        const action = await this.journal.get(actionId);

        if (!action) {
          throw new MercyError(
            "ACTION_NOT_FOUND",
            `Action not found: ${actionId}`
          );
        }

        if (action.status !== "completed") {
          continue;
        }

        const result = await this.undo(actionId);

        results.push(result);

        if (!result.success) {
          const groupResult = {
            groupId,
            success: false,
            conflict: result.conflict,
            results,
            error: result.error??""
          };

          await this.groupJournal.markUndoFailed(
            groupId,
            groupResult
          );

          return groupResult;
        }
      }

      const groupResult = {
        groupId,
        success: true,
        conflict: false,
        results
      };

      await this.groupJournal.markUndone(
        groupId,
        groupResult
      );

      return groupResult;
    } catch (error) {
      const groupResult = {
        groupId,
        success: false,
        conflict: false,
        results,
        error: this.getErrorMessage(error)
      };

      await this.groupJournal.markUndoFailed(
        groupId,
        groupResult
      );

      throw error;
    }
  }

  async getAction(actionId: string) {
    return this.journal.get(actionId);
  }

  async listActions(projectId: string) {
    return this.journal.list(projectId);
  }

  async getGroup(
    groupId: string
  ): Promise<ActionGroup> {
    const group = await this.groupJournal.get(
      groupId
    );

    if (!group) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action group not found: ${groupId}`
      );
    }

    return group;
  }

  async listGroups(projectId: string) {
    return this.groupJournal.list(projectId);
  }

  private async validateGroup(
    groupId: string,
    projectId: string
  ): Promise<void> {
    const group = await this.getGroup(groupId);

    if (group.projectId !== projectId) {
      throw new MercyError(
        "INVALID_INPUT",
        "Action group and action must belong to the same project"
      );
    }

    if (
      group.status !== "pending" &&
      group.status !== "running"
    ) {
      throw new MercyError(
        "ACTION_FAILED",
        `Action group is not accepting actions: ${groupId}`
      );
    }

    if (group.status === "pending") {
      await this.groupJournal.markRunning(
        groupId
      );
    }
  }

  private findAdapter(
    input: ActionInput
  ): ActionAdapter {
    const adapter = this.adapters.find(
      (candidate) => candidate.canHandle(input)
    );

    if (!adapter) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `No adapter can handle action: ${input.type}`
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