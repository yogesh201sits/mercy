import { describe, expect, test } from "bun:test";
import type {
  ActionAdapter,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  SnapshotStore,
  UndoResult,
  VerificationResult
} from "../packages/core/src";
import {
  InMemoryActionJournal
} from "../packages/journal/src";
import { MercyError } from "../packages/shared/src";
import { UndoEngine } from "../packages/undo/src";

class TestSnapshotStore implements SnapshotStore {
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly data = new Map<string, Uint8Array>();

  async create(input: {
    actionId: string;
    data: Uint8Array;
  }): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      actionId: input.actionId,
      storageKey: `${input.actionId}.snapshot`,
      checksum: "checksum",
      size: input.data.byteLength,
      createdAt: new Date()
    };

    this.snapshots.set(snapshot.id, snapshot);
    this.data.set(snapshot.id, input.data);

    return snapshot;
  }

  async get(snapshotId: string): Promise<Snapshot | null> {
    return this.snapshots.get(snapshotId) ?? null;
  }

  async read(snapshotId: string): Promise<Uint8Array> {
    const data = this.data.get(snapshotId);

    if (!data) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `Snapshot not found: ${snapshotId}`
      );
    }

    return data;
  }

  async delete(snapshotId: string): Promise<void> {
    this.snapshots.delete(snapshotId);
    this.data.delete(snapshotId);
  }
}

class TestAdapter implements ActionAdapter {
  readonly name = "test";

  verifyResult: VerificationResult = {
    valid: true,
    conflict: false
  };

  undoResult: UndoResult = {
    actionId: "",
    success: true,
    conflict: false
  };

  undoCalls = 0;

  canHandle(_input: ActionInput): boolean {
    return true;
  }

  async prepare(input: ActionInput): Promise<PreparedAction> {
    return {
      actionId: "prepared",
      input,
      undoStrategy: "restore"
    };
  }

  async snapshot(
    _action: PreparedAction
  ): Promise<CapturedState> {
    return {
      data: new Uint8Array([1, 2, 3])
    };
  }

  async execute(
    _action: PreparedAction
  ): Promise<ActionResult> {
    return {
      actionId: "test",
      success: true
    };
  }

  async verify(
    _action: Parameters<ActionAdapter["verify"]>[0]
  ): Promise<VerificationResult> {
    return this.verifyResult;
  }

  async undo(
    action: Parameters<ActionAdapter["undo"]>[0],
    _snapshot: Snapshot,
    _data: Uint8Array
  ): Promise<UndoResult> {
    this.undoCalls++;

    return {
      ...this.undoResult,
      actionId: action.id
    };
  }
}

describe("UndoEngine", () => {
  test("successfully undoes an action", async () => {
    const journal = new InMemoryActionJournal();
    const snapshots = new TestSnapshotStore();
    const adapter = new TestAdapter();

    const action = await journal.create({
      id: "action-1",
      input: {
        projectId: "project-1",
        type: "update",
        target: "file.txt"
      },
      undoStrategy: "restore"
    });

    const snapshot = await snapshots.create({
      actionId: action.id,
      data: new Uint8Array([1, 2, 3])
    });

    await journal.markSnapshotCreated(
      action.id,
      snapshot.id
    );

    await journal.markRunning(action.id);

    await journal.markCompleted(
      action.id,
      {
        actionId: action.id,
        success: true,
        afterHash: "hash"
      },
      "hash"
    );

    const engine = new UndoEngine({
      journal,
      snapshots,
      adapters: [adapter]
    });

    const result = await engine.undo(action.id);

    expect(result.success).toBe(true);
    expect(result.conflict).toBe(false);
    expect(adapter.undoCalls).toBe(1);

    const updated = await journal.get(action.id);

    expect(updated?.status).toBe("undone");
    expect(updated?.undoResult?.success).toBe(true);
  });

  test("returns existing result when action is already undone", async () => {
    const journal = new InMemoryActionJournal();
    const snapshots = new TestSnapshotStore();
    const adapter = new TestAdapter();

    const action = await journal.create({
      id: "action-2",
      input: {
        projectId: "project-1",
        type: "delete",
        target: "file.txt"
      },
      undoStrategy: "restore"
    });

    const result: UndoResult = {
      actionId: action.id,
      success: true,
      conflict: false
    };

    await journal.markUndone(action.id, result);

    const engine = new UndoEngine({
      journal,
      snapshots,
      adapters: [adapter]
    });

    const undoResult = await engine.undo(action.id);

    expect(undoResult).toEqual(result);
    expect(adapter.undoCalls).toBe(0);
  });

  test("throws when action does not exist", async () => {
    const engine = new UndoEngine({
      journal: new InMemoryActionJournal(),
      snapshots: new TestSnapshotStore(),
      adapters: [new TestAdapter()]
    });

    await expect(
      engine.undo("missing-action")
    ).rejects.toThrow("Action not found");
  });

  test("throws when action has no snapshot", async () => {
    const journal = new InMemoryActionJournal();

    await journal.create({
      id: "action-3",
      input: {
        projectId: "project-1",
        type: "update",
        target: "file.txt"
      },
      undoStrategy: "restore"
    });

    const engine = new UndoEngine({
      journal,
      snapshots: new TestSnapshotStore(),
      adapters: [new TestAdapter()]
    });

    await expect(
      engine.undo("action-3")
    ).rejects.toThrow("No snapshot exists");
  });

  test("returns conflict when verification fails", async () => {
    const journal = new InMemoryActionJournal();
    const snapshots = new TestSnapshotStore();
    const adapter = new TestAdapter();

    adapter.verifyResult = {
      valid: false,
      conflict: true,
      reason: "File changed externally"
    };

    const action = await journal.create({
      id: "action-4",
      input: {
        projectId: "project-1",
        type: "update",
        target: "file.txt"
      },
      undoStrategy: "restore"
    });

    const snapshot = await snapshots.create({
      actionId: action.id,
      data: new Uint8Array([1])
    });

    await journal.markSnapshotCreated(
      action.id,
      snapshot.id
    );

    const engine = new UndoEngine({
      journal,
      snapshots,
      adapters: [adapter]
    });

    const result = await engine.undo(action.id);

    expect(result.success).toBe(false);
    expect(result.conflict).toBe(true);
    expect(result.error).toBe("File changed externally");

    expect(adapter.undoCalls).toBe(0);
  });

  test("returns adapter undo failure", async () => {
    const journal = new InMemoryActionJournal();
    const snapshots = new TestSnapshotStore();
    const adapter = new TestAdapter();

    adapter.undoResult = {
      actionId: "",
      success: false,
      conflict: false,
      error: "Restore failed"
    };

    const action = await journal.create({
      id: "action-5",
      input: {
        projectId: "project-1",
        type: "update",
        target: "file.txt"
      },
      undoStrategy: "restore"
    });

    const snapshot = await snapshots.create({
      actionId: action.id,
      data: new Uint8Array([1])
    });

    await journal.markSnapshotCreated(
      action.id,
      snapshot.id
    );

    const engine = new UndoEngine({
      journal,
      snapshots,
      adapters: [adapter]
    });

    const result = await engine.undo(action.id);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Restore failed");

    const updated = await journal.get(action.id);

    expect(updated?.status).toBe("undo_failed");
  });
});