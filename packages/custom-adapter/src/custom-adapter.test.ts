import {
  describe,
  expect,
  test,
} from "bun:test";

import type {
  Action,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "@mercy/core";

import {
  CustomAdapter,
} from "./custom-adapter";

const input: ActionInput = {
  projectId: "project-1",
  type: "custom",
  target: "test.tool",
  metadata: {
    value: "hello",
  },
};

const prepared: PreparedAction = {
  actionId: "action-1",
  input,
  undoStrategy: "compensate",
};

const snapshot: Snapshot = {
  id: "snapshot-1",
  actionId: "action-1",
  storageKey: "snapshot-1",
  checksum: "checksum",
  size: 5,
  createdAt: new Date(),
};

const action: Action = {
  id: "action-1",
  projectId: "project-1",
  type: "custom",
  target: "test.tool",
  status: "completed",
  createdAt: new Date(),
  beforeSnapshotId: "snapshot-1",
  undoStrategy: "compensate",
};

describe("CustomAdapter", () => {
  test("delegates canHandle", () => {
    let called = false;

    const adapter = new CustomAdapter({
      name: "test",
      handlers: {
        canHandle: (receivedInput) => {
          called = true;

          expect(receivedInput).toEqual(input);

          return true;
        },

        prepare: async () => prepared,

        snapshot: async () => ({
          data: new TextEncoder().encode("hello"),
        }),

        execute: async () => ({
          actionId: "action-1",
          success: true,
        }),

        undo: async () => ({
          actionId: "action-1",
          success: true,
          conflict: false,
        }),

        verify: async () => ({
          valid: true,
          conflict: false,
        }),
      },
    });

    expect(adapter.name).toBe("test");
    expect(adapter.canHandle(input)).toBe(true);
    expect(called).toBe(true);
  });

  test("delegates prepare", async () => {
    const adapter = createAdapter();

    const result =
      await adapter.prepare(input);

    expect(result).toEqual(prepared);
  });

  test("delegates snapshot", async () => {
    const captured: CapturedState = {
      data: new TextEncoder().encode("hello"),
      metadata: {
        source: "test",
      },
    };

    const adapter =
      createAdapter({
        snapshot: async () => captured,
      });

    const result =
      await adapter.snapshot(prepared);

    expect(result).toEqual(captured);
  });

  test("delegates execute", async () => {
    const actionResult: ActionResult = {
      actionId: "action-1",
      success: true,
      result: {
        created: true,
      },
    };

    const adapter =
      createAdapter({
        execute: async () => actionResult,
      });

    const result =
      await adapter.execute(prepared);

    expect(result).toEqual(actionResult);
  });

  test("delegates undo", async () => {
    const undoResult: UndoResult = {
      actionId: "action-1",
      success: true,
      conflict: false,
    };

    const data =
      new TextEncoder().encode("hello");

    const adapter =
      createAdapter({
        undo: async (
          receivedAction,
          receivedSnapshot,
          receivedData,
        ) => {
          expect(receivedAction).toEqual(action);
          expect(receivedSnapshot).toEqual(snapshot);
          expect(receivedData).toEqual(data);

          return undoResult;
        },
      });

    const result =
      await adapter.undo(
        action,
        snapshot,
        data,
      );

    expect(result).toEqual(undoResult);
  });

  test("delegates verify", async () => {
    const verification: VerificationResult = {
      valid: true,
      conflict: false,
      reason: "state matches",
    };

    const adapter =
      createAdapter({
        verify: async () => verification,
      });

    const result =
      await adapter.verify(action);

    expect(result).toEqual(verification);
  });
});

function createAdapter(
  overrides: Partial<
    ConstructorParameters<
      typeof CustomAdapter
    >[0]["handlers"]
  > = {},
): CustomAdapter {
  return new CustomAdapter({
    name: "test",
    handlers: {
      canHandle: () => true,

      prepare: async () => prepared,

      snapshot: async () => ({
        data: new TextEncoder().encode("hello"),
      }),

      execute: async () => ({
        actionId: "action-1",
        success: true,
      }),

      undo: async () => ({
        actionId: "action-1",
        success: true,
        conflict: false,
      }),

      verify: async () => ({
        valid: true,
        conflict: false,
      }),

      ...overrides,
    },
  });
}