import type {
  ActionAdapter,
  ActionInput,
  ActionResult,
} from "@mercy/core";

import type {
  ActionJournal
} from "@mercy/journal";

import type {
  SnapshotStore
} from "@mercy/core";

import {
  MercyError,
  createId
} from "@mercy/shared";

export interface ActionExecutorDependencies {
  readonly journal: ActionJournal;
  readonly snapshots: SnapshotStore;
  readonly adapters: readonly ActionAdapter[];
}

export class ActionExecutor {
  constructor(
    private readonly dependencies: ActionExecutorDependencies
  ) {}

  async execute(
    input: ActionInput
  ): Promise<ActionResult> {
    const actionId = createId();

    const adapter =
      this.findAdapter(input);

    const action =
      await this.dependencies.journal.create({
        id: actionId,
        input: {
          ...input,
          metadata: {
            ...(input.metadata ?? {}),
            actionId,
          },
        },
        undoStrategy: this.getUndoStrategy(adapter),
      });

    try {
      const prepared =
        await adapter.prepare({
          ...input,
          metadata: {
            ...(input.metadata ?? {}),
            actionId: action.id,
          },
        });

      const snapshot =
        await adapter.snapshot(prepared);

      const persistedSnapshot =
        await this.dependencies.snapshots.create({
          actionId: action.id,
          data: new TextEncoder().encode(
            JSON.stringify(snapshot)
          ),
          ...(snapshot.metadata
            ? {
                metadata: snapshot.metadata,
              }
            : {}),
        });

      await this.dependencies.journal.markRunning(
        action.id
      );

      const result =
        await adapter.execute(prepared);

      if (!result.success) {
        await this.dependencies.journal.markFailed(
          action.id,
          result.error ?? "Action execution failed"
        );

        return result;
      }

      await this.dependencies.journal.markCompleted(
        action.id,
        result
      );

      void persistedSnapshot;

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Action execution failed";

      await this.dependencies.journal.markFailed(
        action.id,
        message
      );

      throw error;
    }
  }

  private findAdapter(
    input: ActionInput
  ): ActionAdapter {
    const adapter =
      this.dependencies.adapters.find(
        (candidate) =>
          candidate.canHandle(input)
      );

    if (!adapter) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `No adapter found for action type: ${input.type}`
      );
    }

    return adapter;
  }

  private getUndoStrategy(
    adapter: ActionAdapter
  ) {
    if (adapter.name === "filesystem") {
      return "restore" as const;
    }

    return "restore" as const;
  }
}