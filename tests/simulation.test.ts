import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import { join } from "node:path";

import type {
  ActionInput,
} from "../packages/core/src";

import {
  InMemoryActionGroupJournal,
} from "../packages/journal/src";

import {
  LocalSnapshotStorage,
} from "../packages/snapshots/src";

import {
  createPrismaClient,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../packages/postgres/src";

import {
  FilesystemAdapter,
} from "../packages/filesystem/src";

import {
  MercyRuntime,
} from "../packages/runtime/src/runtime";

const projectId =
  `agent-simulation-${crypto.randomUUID()}`;

const workspaceRoot =
  `${process.cwd()}/.test-agent-simulation/${projectId}`;

const snapshotRoot =
  `${process.cwd()}/.test-snapshots/${crypto.randomUUID()}`;

function createRuntime() {
  const prisma =
    createPrismaClient();

  const actionJournal =
    new PostgresActionJournal(prisma);

  const groupJournal =
    new InMemoryActionGroupJournal();

  const snapshotStorage =
    new LocalSnapshotStorage(
      snapshotRoot,
    );

  const snapshots =
    new PostgresSnapshotStore(
      prisma,
      snapshotStorage,
    );

  const adapter =
    new FilesystemAdapter(
      workspaceRoot,
    );

  const runtime =
    new MercyRuntime({
      journal: actionJournal,
      groupJournal,
      snapshots,
      adapters: [
        adapter,
      ],
    });

  return {
    runtime,
    actionJournal,
    groupJournal,
    snapshots,
    snapshotStorage,
    adapter,
    prisma,
  };
}

describe(
  "Fake Agent → Mercy simulation",
  () => {
    let runtime: MercyRuntime;

    let actionJournal:
      PostgresActionJournal;

    let snapshots:
      PostgresSnapshotStore;

    let prisma:
      ReturnType<
        typeof createPrismaClient
      >;

    beforeEach(async () => {
      await rm(
        workspaceRoot,
        {
          recursive: true,
          force: true,
        },
      );

      await mkdir(
        workspaceRoot,
        {
          recursive: true,
        },
      );

      const created =
        createRuntime();

      runtime =
        created.runtime;

      actionJournal =
        created.actionJournal;

      snapshots =
        created.snapshots;

      prisma =
        created.prisma;
    });

    afterAll(async () => {
      await rm(
        workspaceRoot,
        {
          recursive: true,
          force: true,
        },
      );

      await rm(
        snapshotRoot,
        {
          recursive: true,
          force: true,
        },
      );

      await prisma.$disconnect();
    });

    test(
      "fake agent updates a file and undoes the action",
      async () => {
        const configPath =
          join(
            workspaceRoot,
            "config.json",
          );

        // ---------------------------------------------
        // Initial state
        // ---------------------------------------------

        const originalConfig = {
          port: 3000,
          debug: false,
        };

        await writeFile(
          configPath,
          JSON.stringify(
            originalConfig,
            null,
            2,
          ),
          "utf8",
        );

        // ---------------------------------------------
        // Fake agent action
        // ---------------------------------------------

        const agentAction: ActionInput = {
          projectId,

          type: "update",

          target: "config.json",

          metadata: {
            actionId:
              crypto.randomUUID(),

            content:
              JSON.stringify(
                {
                  port: 8080,
                  debug: true,
                },
                null,
                2,
              ),
          },
        };

        console.log(
          "\n🤖 Agent: updating config.json",
        );

        // ---------------------------------------------
        // Execute
        // ---------------------------------------------

        const result =
          await runtime.execute(
            agentAction,
          );

        expect(
          result.success,
        ).toBe(true);

        console.log(
          "✅ Action executed:",
          result.actionId,
        );

        // ---------------------------------------------
        // Get action
        // ---------------------------------------------

        const storedAction =
          await actionJournal.get(
            result.actionId,
          );

        expect(
          storedAction,
        ).not.toBeNull();

        expect(
          storedAction?.beforeSnapshotId,
        ).toBeDefined();

        const snapshotId =
          storedAction!
            .beforeSnapshotId!;

        console.log(
          "📸 Before snapshot:",
          snapshotId,
        );

        // ---------------------------------------------
        // Verify snapshot from PostgreSQL
        // ---------------------------------------------

        const snapshot =
          await snapshots.get(
            snapshotId,
          );

        expect(
          snapshot,
        ).not.toBeNull();

        expect(
          snapshot?.actionId,
        ).toBe(
          result.actionId,
        );

        // ---------------------------------------------
        // Verify snapshot bytes
        // ---------------------------------------------

        const snapshotData =
          await snapshots.read(
            snapshotId,
          );

        const snapshotContent =
          new TextDecoder().decode(
            snapshotData,
          );

        expect(
          snapshotContent,
        ).toContain(
          `"port": 3000`,
        );

        expect(
          snapshotContent,
        ).toContain(
          `"debug": false`,
        );

        // ---------------------------------------------
        // Verify agent's change
        // ---------------------------------------------

        const updated =
          await readFile(
            configPath,
            "utf8",
          );

        console.log(
          "📄 After agent action:",
        );

        console.log(
          updated,
        );

        expect(
          JSON.parse(updated),
        ).toEqual({
          port: 8080,
          debug: true,
        });

        // ---------------------------------------------
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing action",
        );

        const undo =
          await runtime.undo(
            result.actionId,
          );

        expect(
          undo.success,
        ).toBe(true);

        expect(
          undo.conflict,
        ).toBe(false);

        expect(
          undo.actionId,
        ).toBe(
          result.actionId,
        );

        console.log(
          "✅ Undo completed",
        );

        // ---------------------------------------------
        // Verify restored state
        // ---------------------------------------------

        const restored =
          await readFile(
            configPath,
            "utf8",
          );

        console.log(
          "📄 After undo:",
        );

        console.log(
          restored,
        );

        expect(
          JSON.parse(restored),
        ).toEqual(
          originalConfig,
        );
      },
      45_000,
    );
  },
);