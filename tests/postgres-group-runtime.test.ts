import {
  afterAll,
  describe,
  expect,
  test,
} from "bun:test";

import type {
  ActionAdapter,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "../packages/core/src";

import {
  LocalSnapshotStorage,
  LocalSnapshotStore,
} from "../packages/snapshots/src";

import {
  PostgresActionGroupJournal,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../packages/postgres/src";

import {
  createPrismaClient,
} from "../packages/postgres/src/client/client";

import {
  MercyRuntime,
} from "../packages/runtime/src/runtime";

const prisma = createPrismaClient();

const projectId =
  `runtime-project-${crypto.randomUUID()}`;

class TestAdapter implements ActionAdapter {
  readonly name = "test";

  readonly executed: string[] = [];
  readonly undone: string[] = [];
  readonly undoFailures = new Set<string>();

  canHandle(input: ActionInput): boolean {
    return input.type === "custom";
  }

  async prepare(
    input: ActionInput,
  ): Promise<PreparedAction> {
    const actionId = String(
      input.metadata?.["actionId"],
    );

    return {
      actionId,
      input,
      undoStrategy: "restore",
    };
  }

  async snapshot(
    _action: PreparedAction,
  ): Promise<CapturedState> {
    return {
      data: new TextEncoder().encode("before"),
    };
  }

  async execute(
    action: PreparedAction,
  ): Promise<ActionResult> {
    this.executed.push(action.actionId);

    return {
      actionId: action.actionId,
      success: true,
    };
  }

  async undo(
    action: { id: string },
    _snapshot: Snapshot,
    _data: Uint8Array,
  ): Promise<UndoResult> {
    this.undone.push(action.id);

    if (this.undoFailures.has(action.id)) {
      return {
        actionId: action.id,
        success: false,
        conflict: true,
        error: "Test undo conflict",
      };
    }

    return {
      actionId: action.id,
      success: true,
      conflict: false,
    };
  }

  async verify(
    _action: { id: string },
  ): Promise<VerificationResult> {
    return {
      valid: true,
      conflict: false,
    };
  }
}

function createPostgresRuntime2() {
  const actionJournal =
    new PostgresActionJournal(prisma);

  const groupJournal =
    new PostgresActionGroupJournal(prisma);

  const snapshotRoot =
    `${process.cwd()}/.test-snapshots/${crypto.randomUUID()}`;

  const snapshotStorage =
    new LocalSnapshotStorage(snapshotRoot);

  const snapshots =
    new PostgresSnapshotStore(
      prisma,
      snapshotStorage,
    );

  const adapter =
    new TestAdapter();

  const runtime =
    new MercyRuntime({
      journal: actionJournal,
      groupJournal,
      snapshots,
      adapters: [adapter],
    });

  return {
    runtime,
    groupJournal,
    adapter,
    snapshots,
    snapshotStorage,
  };
}

function createRuntime() {
  const actionJournal =
    new PostgresActionJournal(prisma);

  const groupJournal =
    new PostgresActionGroupJournal(prisma);

  const snapshotRoot =
    `${process.cwd()}/.test-snapshots/${crypto.randomUUID()}`;

  const snapshotStorage =
    new LocalSnapshotStorage(snapshotRoot);

  const snapshots =
    new LocalSnapshotStore(snapshotStorage);

  const adapter =
    new TestAdapter();

  const runtime =
    new MercyRuntime({
      journal: actionJournal,
      groupJournal,
      snapshots,
      adapters: [adapter],
    });

  return {
    runtime,
    groupJournal,
    adapter,
    snapshots,
  };
}

function createPostgresRuntime() {
  const actionJournal =
    new PostgresActionJournal(prisma);

  const groupJournal =
    new PostgresActionGroupJournal(prisma);

  const snapshotRoot =
    `${process.cwd()}/.test-snapshots/postgres/${crypto.randomUUID()}`;

  const snapshotStorage =
    new LocalSnapshotStorage(snapshotRoot);

  const snapshots =
    new PostgresSnapshotStore(
      prisma,
      snapshotStorage,
    );

  const adapter =
    new TestAdapter();

  const runtime =
    new MercyRuntime({
      journal: actionJournal,
      groupJournal,
      snapshots,
      adapters: [adapter],
    });

  return {
    runtime,
    groupJournal,
    adapter,
    snapshots,
  };
}

function createActionInput(
  target: string,
): ActionInput {
  return {
    projectId,
    type: "custom",
    target,
  };
}

async function cleanup() {
  await prisma.actionGroupAction.deleteMany({
    where: {
      group: {
        projectId,
      },
    },
  });

  await prisma.actionGroup.deleteMany({
    where: {
      projectId,
    },
  });

  await prisma.action.deleteMany({
    where: {
      projectId,
    },
  });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe(
  "MercyRuntime with PostgreSQL action groups",
  () => {
    test(
      "persists runtime group lifecycle",
      async () => {
        const {
          runtime,
          groupJournal,
        } = createRuntime();

        const group =
          await runtime.startGroup({
            projectId,
          });

        const first =
          await runtime.execute(
            createActionInput("first"),
            group.id,
          );

        const second =
          await runtime.execute(
            createActionInput("second"),
            group.id,
          );

        const stored =
          await groupJournal.get(group.id);

        expect(stored).not.toBeNull();

        expect(stored?.status).toBe(
          "running",
        );

        expect(
          stored?.actionIds,
        ).toEqual([
          first.actionId,
          second.actionId,
        ]);

        await runtime.completeGroup(
          group.id,
        );

        const completed =
          await groupJournal.get(
            group.id,
          );

        expect(completed).not.toBeNull();

        expect(
          completed?.status,
        ).toBe("completed");

        expect(
          completed?.actionIds,
        ).toEqual([
          first.actionId,
          second.actionId,
        ]);
      },
      45_000,
    );

    test(
      "restores the group from PostgreSQL using a fresh journal",
      async () => {
        const {
          runtime,
        } = createRuntime();

        const group =
          await runtime.startGroup({
            projectId,
          });

        const action =
          await runtime.execute(
            createActionInput(
              "persistent",
            ),
            group.id,
          );

        await runtime.completeGroup(
          group.id,
        );

        const freshJournal =
          new PostgresActionGroupJournal(
            prisma,
          );

        const restored =
          await freshJournal.get(
            group.id,
          );

        expect(restored).not.toBeNull();

        expect(
          restored?.id,
        ).toBe(group.id);

        expect(
          restored?.projectId,
        ).toBe(projectId);

        expect(
          restored?.status,
        ).toBe("completed");

        expect(
          restored?.actionIds,
        ).toEqual([
          action.actionId,
        ]);
      },
      15_000,
    );

    test(
      "persists snapshot metadata in PostgreSQL and snapshot data in storage",
      async () => {
        const {
          runtime,
          snapshots,
        } = createPostgresRuntime();

        const group =
          await runtime.startGroup({
            projectId,
          });

        const action =
          await runtime.execute(
            createActionInput(
              "postgres-snapshot",
            ),
            group.id,
          );

        const storedAction =
          await prisma.action.findUnique({
            where: {
              id: action.actionId,
            },
          });

        expect(
          storedAction,
        ).not.toBeNull();

        expect(
          storedAction?.beforeSnapshotId,
        ).not.toBeNull();

        const snapshotId =
          storedAction!.beforeSnapshotId!;

        const snapshot =
          await snapshots.get(
            snapshotId,
          );

        expect(
          snapshot,
        ).not.toBeNull();

        expect(
          snapshot?.id,
        ).toBe(snapshotId);

        expect(
          snapshot?.actionId,
        ).toBe(action.actionId);

        expect(
          snapshot?.size,
        ).toBe(6);

        expect(
          snapshot?.storageKey,
        ).toBe(
          `${action.actionId}/${snapshotId}.snapshot`,
        );

        const data =
          await snapshots.read(
            snapshotId,
          );

        expect(
          new TextDecoder().decode(data),
        ).toBe("before");
      },
      45_000,
    );
    test("returns successfully when undoing an already undone group", async () => {
      const {
        runtime,
        groupJournal,
        adapter,
      } = createPostgresRuntime();

      const group = await runtime.startGroup({
        projectId,
      });

      const action = await runtime.execute(
        createActionInput("idempotent"),
        group.id,
      );

      await runtime.completeGroup(group.id);

      const first = await runtime.undoGroup(
        group.id,
      );

      expect(first.success).toBe(true);
      expect(adapter.undone).toEqual([
        action.actionId,
      ]);

      const second = await runtime.undoGroup(
        group.id,
      );

      expect(second.success).toBe(true);
      expect(second.conflict).toBe(false);

      expect(adapter.undone).toEqual([
        action.actionId,
      ]);

      const stored =
        await groupJournal.get(group.id);

      expect(stored?.status).toBe("undone");
    });
    test("undoes completed group actions in reverse order", async () => {
      const {
        runtime,
        groupJournal,
        adapter,
      } = createPostgresRuntime();

      const group = await runtime.startGroup({
        projectId,
      });

      const first = await runtime.execute(
        createActionInput("first"),
        group.id,
      );

      const second = await runtime.execute(
        createActionInput("second"),
        group.id,
      );

      const third = await runtime.execute(
        createActionInput("third"),
        group.id,
      );

      await runtime.completeGroup(group.id);

      const result = await runtime.undoGroup(
        group.id,
      );

      expect(result.success).toBe(true);
      expect(result.conflict).toBe(false);

      expect(adapter.undone).toEqual([
        third.actionId,
        second.actionId,
        first.actionId,
      ]);

      const stored =
        await groupJournal.get(group.id);

      expect(stored).not.toBeNull();
      expect(stored?.status).toBe("undone");
    }, 45_000);

    test("marks group undo as failed when an action cannot be undone", async () => {
      const {
        runtime,
        groupJournal,
        adapter,
      } = createPostgresRuntime();

      const group = await runtime.startGroup({
        projectId,
      });

      const first = await runtime.execute(
        createActionInput("first"),
        group.id,
      );

      const second = await runtime.execute(
        createActionInput("second"),
        group.id,
      );

      const third = await runtime.execute(
        createActionInput("third"),
        group.id,
      );

      await runtime.completeGroup(group.id);

      adapter.undoFailures.add(
        second.actionId,
      );

      const result = await runtime.undoGroup(
        group.id,
      );

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.results).toHaveLength(2);

      expect(adapter.undone).toEqual([
        third.actionId,
        second.actionId,
      ]);

      const stored =
        await groupJournal.get(group.id);

      expect(stored).not.toBeNull();
      expect(stored?.status).toBe("undo_failed");
    }, 45_000);

    test("retries a failed group undo and completes remaining actions", async () => {
      const {
        runtime,
        groupJournal,
        adapter,
      } = createPostgresRuntime();

      const group = await runtime.startGroup({
        projectId,
      });

      const first = await runtime.execute(
        createActionInput("first"),
        group.id,
      );

      const second = await runtime.execute(
        createActionInput("second"),
        group.id,
      );

      const third = await runtime.execute(
        createActionInput("third"),
        group.id,
      );

      await runtime.completeGroup(group.id);

      adapter.undoFailures.add(
        second.actionId,
      );

      const failed = await runtime.undoGroup(
        group.id,
      );

      expect(failed.success).toBe(false);
      expect(failed.conflict).toBe(true);

      expect(adapter.undone).toEqual([
        third.actionId,
        second.actionId,
      ]);

      adapter.undoFailures.delete(
        second.actionId,
      );

      const retry = await runtime.undoGroup(
        group.id,
      );

      expect(retry.success).toBe(true);
      expect(retry.conflict).toBe(false);

      expect(adapter.undone).toEqual([
        third.actionId,
        second.actionId,
        first.actionId,
      ]);

      const stored =
        await groupJournal.get(group.id);

      expect(stored).not.toBeNull();
      expect(stored?.status).toBe("undone");
    }, 45_000);
  },
);