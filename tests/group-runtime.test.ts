import { describe, expect, test } from "bun:test";
import type {
  ActionInput,
  ActionResult,
  ActionAdapter,
  PreparedAction,
  CapturedState,
  Snapshot,
  Action,
  UndoResult
} from "../packages/core/src";
import {
  InMemoryActionGroupJournal,
  InMemoryActionJournal
} from "../packages/journal/src";
import { MercyRuntime } from "../packages/runtime/src";

class TestAdapter implements ActionAdapter {
  readonly name = "test";

  readonly executed: string[] = [];
  readonly undone: string[] = [];
  private readonly failures = new Set<string>();

  failTarget(target: string): void {
    this.failures.add(target);
  }

  canHandle(input: ActionInput): boolean {
    return input.type === "custom";
  }

  async prepare(
    input: ActionInput
  ): Promise<PreparedAction> {
    return {
      actionId: String(input.metadata?.["actionId"]),
      input,
      undoStrategy: "compensate"
    };
  }

  async snapshot(
    _action: PreparedAction
  ): Promise<CapturedState> {
    return {
      data: new Uint8Array()
    };
  }

  async execute(
    action: PreparedAction
  ): Promise<ActionResult> {
    if (this.failures.has(action.input.target)) {
      return {
        actionId: action.actionId,
        success: false,
        error: `Execution failed: ${action.input.target}`
      };
    }

    this.executed.push(action.actionId);

    return {
      actionId: action.actionId,
      success: true,
      afterHash: `hash-${action.actionId}`
    };
  }

  async undo(
    action: Action,
    _snapshot: Snapshot,
    _data: Uint8Array
  ): Promise<UndoResult> {
    this.undone.push(action.id);

    return {
      actionId: action.id,
      success: true,
      conflict: false
    };
  }

  async verify(
    _action: Action
  ) {
    return {
      valid: true,
      conflict: false
    };
  }
}

class TestSnapshotStore {
  private readonly snapshots = new Map<
    string,
    Uint8Array
  >();

  async create(input: {
    actionId: string;
    data: Uint8Array;
  }): Promise<Snapshot> {
    const id = `snapshot-${input.actionId}`;

    this.snapshots.set(
      id,
      input.data
    );

    return {
      id,
      actionId: input.actionId,
      storageKey: id,
      checksum: "test-checksum",
      size: input.data.byteLength,
      createdAt: new Date()
    };
  }

  async get(
    snapshotId: string
  ): Promise<Snapshot | null> {
    if (!this.snapshots.has(snapshotId)) {
      return null;
    }

    const actionId = snapshotId.replace(
      "snapshot-",
      ""
    );

    return {
      id: snapshotId,
      actionId,
      storageKey: snapshotId,
      checksum: "test-checksum",
      size: 0,
      createdAt: new Date()
    };
  }

  async read(
    snapshotId: string
  ): Promise<Uint8Array> {
    return this.snapshots.get(snapshotId) ?? new Uint8Array();
  }

  async delete(
    snapshotId: string
  ): Promise<void> {
    this.snapshots.delete(snapshotId);
  }
}

function createRuntime() {
  const journal = new InMemoryActionJournal();
  const groupJournal =
    new InMemoryActionGroupJournal();
  const snapshots = new TestSnapshotStore();
  const adapter = new TestAdapter();

  const runtime = new MercyRuntime({
    journal,
    groupJournal,
    snapshots,
    adapters: [adapter]
  });

  return {
    runtime,
    journal,
    groupJournal,
    adapter
  };
}

function createInput(
  target: string
): ActionInput {
  return {
    projectId: "project-1",
    type: "custom",
    target
  };
}

describe("MercyRuntime action groups", () => {
  test("creates an explicit action group", async () => {
    const {
      runtime
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    expect(group.projectId).toBe(
      "project-1"
    );

    expect(group.status).toBe("pending");
    expect(group.actionIds).toEqual([]);
  });

  test("only actions explicitly assigned to the group become members", async () => {
    const {
      runtime
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    const groupedAction =
      await runtime.execute(
        createInput("grouped"),
        group.id
      );

    await runtime.execute(
      createInput("standalone")
    );

    const updated =
      await runtime.getGroup(group.id);

    expect(updated.actionIds).toEqual([
      groupedAction.actionId
    ]);
  });

  test("executes multiple actions in a group", async () => {
    const {
      runtime,
      adapter
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    await runtime.execute(
      createInput("one"),
      group.id
    );

    await runtime.execute(
      createInput("two"),
      group.id
    );

    await runtime.execute(
      createInput("three"),
      group.id
    );

    expect(adapter.executed).toHaveLength(3);

    const updated =
      await runtime.getGroup(group.id);

    expect(updated.actionIds).toHaveLength(3);
  });

  test("completes a non-empty group", async () => {
    const {
      runtime
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    await runtime.execute(
      createInput("one"),
      group.id
    );

    const completed =
      await runtime.completeGroup(group.id);

    expect(completed.status).toBe(
      "completed"
    );
  });

  test("rejects an empty group", async () => {
    const {
      runtime
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    expect(
      runtime.completeGroup(group.id)
    ).rejects.toThrow(
      "Cannot complete empty action group"
    );
  });

  test("undoes grouped actions in reverse order", async () => {
    const {
      runtime,
      adapter
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    const first = await runtime.execute(
      createInput("one"),
      group.id
    );

    const second = await runtime.execute(
      createInput("two"),
      group.id
    );

    const third = await runtime.execute(
      createInput("three"),
      group.id
    );

    await runtime.completeGroup(
      group.id
    );

    const result =
      await runtime.undoGroup(group.id);

    expect(result.success).toBe(true);
    expect(result.conflict).toBe(false);

    expect(adapter.undone).toEqual([
      third.actionId,
      second.actionId,
      first.actionId
    ]);

    expect(result.results).toHaveLength(3);

    const updated =
      await runtime.getGroup(group.id);

    expect(updated.status).toBe("undone");
  });

  test("allows rollback of completed actions after a later action fails", async () => {
    const {
      runtime,
      adapter
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    const first = await runtime.execute(
      createInput("one"),
      group.id
    );

    const second = await runtime.execute(
      createInput("two"),
      group.id
    );

    adapter.failTarget("three");

    const third = await runtime.execute(
      createInput("three"),
      group.id
    );

    expect(third.success).toBe(false);

    const failedGroup =
      await runtime.getGroup(group.id);

    expect(failedGroup.status).toBe("failed");
    expect(adapter.undone).toEqual([]);

    const result =
      await runtime.undoGroup(group.id);

    expect(result.success).toBe(true);

    expect(adapter.undone).toEqual([
      second.actionId,
      first.actionId
    ]);

    const updated =
      await runtime.getGroup(group.id);

    expect(updated.status).toBe("undone");
  });

  test("does not allow undo before group completion", async () => {
    const {
      runtime
    } = createRuntime();

    const group = await runtime.startGroup({
      projectId: "project-1"
    });

    await runtime.execute(
      createInput("one"),
      group.id
    );

    expect(
      runtime.undoGroup(group.id)
    ).rejects.toThrow(
      "Action group cannot be undone in its current state: running"
    );
  });
});