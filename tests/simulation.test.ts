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
  "Fake Agent → Mercy filesystem simulation",
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

    // =========================================================
    // CREATE
    // =========================================================

    test(
      "fake agent creates a file and undoes the action",
      async () => {
        const filePath =
          join(
            workspaceRoot,
            "created.txt",
          );

        // ---------------------------------------------
        // Initial state
        // ---------------------------------------------

        expect(
          await Bun.file(filePath).exists(),
        ).toBe(false);

        // ---------------------------------------------
        // Agent action
        // ---------------------------------------------

        const agentAction: ActionInput = {
          projectId,

          type: "create",

          target: "created.txt",

          metadata: {
            actionId:
              crypto.randomUUID(),

            content:
              "Hello from Mercy",
          },
        };

        console.log(
          "\n🤖 Agent: creating created.txt",
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

        // ---------------------------------------------
        // Verify created file
        // ---------------------------------------------

        const created =
          await readFile(
            filePath,
            "utf8",
          );

        expect(
          created,
        ).toBe(
          "Hello from Mercy",
        );

        // ---------------------------------------------
        // Verify snapshot
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

        const snapshot =
          await snapshots.get(
            storedAction!
              .beforeSnapshotId!,
          );

        expect(
          snapshot,
        ).not.toBeNull();

        // ---------------------------------------------
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing create",
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

        // ---------------------------------------------
        // Verify file was removed
        // ---------------------------------------------

        expect(
          await Bun.file(filePath).exists(),
        ).toBe(false);
      },
      45_000,
    );

    // =========================================================
    // UPDATE
    // =========================================================

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
        // Agent action
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

        // ---------------------------------------------
        // Verify updated state
        // ---------------------------------------------

        const updated =
          await readFile(
            configPath,
            "utf8",
          );

        expect(
          JSON.parse(updated),
        ).toEqual({
          port: 8080,
          debug: true,
        });

        // ---------------------------------------------
        // Verify snapshot
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
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing update",
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

        // ---------------------------------------------
        // Verify restored state
        // ---------------------------------------------

        const restored =
          await readFile(
            configPath,
            "utf8",
          );

        expect(
          JSON.parse(restored),
        ).toEqual(
          originalConfig,
        );
      },
      45_000,
    );

    // =========================================================
    // DELETE
    // =========================================================

    test(
      "fake agent deletes a file and undoes the action",
      async () => {
        const filePath =
          join(
            workspaceRoot,
            "delete-me.txt",
          );

        const originalContent =
          "This file must be restored.";

        // ---------------------------------------------
        // Initial state
        // ---------------------------------------------

        await writeFile(
          filePath,
          originalContent,
          "utf8",
        );

        expect(
          await Bun.file(filePath).exists(),
        ).toBe(true);

        // ---------------------------------------------
        // Agent action
        // ---------------------------------------------

        const agentAction: ActionInput = {
          projectId,

          type: "delete",

          target: "delete-me.txt",

          metadata: {
            actionId:
              crypto.randomUUID(),
          },
        };

        console.log(
          "\n🤖 Agent: deleting delete-me.txt",
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

        // ---------------------------------------------
        // Verify deleted
        // ---------------------------------------------

        expect(
          await Bun.file(filePath).exists(),
        ).toBe(false);

        // ---------------------------------------------
        // Verify snapshot
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

        const snapshotData =
          await snapshots.read(
            storedAction!
              .beforeSnapshotId!,
          );

        expect(
          new TextDecoder().decode(
            snapshotData,
          ),
        ).toBe(
          originalContent,
        );

        // ---------------------------------------------
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing delete",
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

        // ---------------------------------------------
        // Verify restored
        // ---------------------------------------------

        const restored =
          await readFile(
            filePath,
            "utf8",
          );

        expect(
          restored,
        ).toBe(
          originalContent,
        );
      },
      45_000,
    );

    // =========================================================
    // RENAME
    // =========================================================

    test(
      "fake agent renames a file and undoes the action",
      async () => {
        const sourcePath =
          join(
            workspaceRoot,
            "old-name.txt",
          );

        const destinationPath =
          join(
            workspaceRoot,
            "new-name.txt",
          );

        const originalContent =
          "Rename me";

        // ---------------------------------------------
        // Initial state
        // ---------------------------------------------

        await writeFile(
          sourcePath,
          originalContent,
          "utf8",
        );

        // ---------------------------------------------
        // Agent action
        // ---------------------------------------------

        const agentAction: ActionInput = {
          projectId,

          type: "rename",

          target: "old-name.txt",

          metadata: {
            actionId:
              crypto.randomUUID(),

            destination:
              "new-name.txt",
          },
        };

        console.log(
          "\n🤖 Agent: renaming old-name.txt → new-name.txt",
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

        // ---------------------------------------------
        // Verify rename
        // ---------------------------------------------

        expect(
          await Bun.file(sourcePath).exists(),
        ).toBe(false);

        expect(
          await Bun.file(destinationPath).exists(),
        ).toBe(true);

        expect(
          await readFile(
            destinationPath,
            "utf8",
          ),
        ).toBe(
          originalContent,
        );

        // ---------------------------------------------
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing rename",
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

        // ---------------------------------------------
        // Verify reverse rename
        // ---------------------------------------------

        expect(
          await Bun.file(sourcePath).exists(),
        ).toBe(true);

        expect(
          await Bun.file(destinationPath).exists(),
        ).toBe(false);

        expect(
          await readFile(
            sourcePath,
            "utf8",
          ),
        ).toBe(
          originalContent,
        );
      },
      45_000,
    );

    // =========================================================
    // MOVE
    // =========================================================

    test(
      "fake agent moves a file and undoes the action",
      async () => {
        const sourceDirectory =
          join(
            workspaceRoot,
            "uploads",
          );

        const destinationDirectory =
          join(
            workspaceRoot,
            "archive",
          );

        const sourcePath =
          join(
            sourceDirectory,
            "report.txt",
          );

        const destinationPath =
          join(
            destinationDirectory,
            "report.txt",
          );

        const originalContent =
          "Move me";

        // ---------------------------------------------
        // Initial state
        // ---------------------------------------------

        await mkdir(
          sourceDirectory,
          {
            recursive: true,
          },
        );

        await mkdir(
          destinationDirectory,
          {
            recursive: true,
          },
        );

        await writeFile(
          sourcePath,
          originalContent,
          "utf8",
        );

        // ---------------------------------------------
        // Agent action
        // ---------------------------------------------

        const agentAction: ActionInput = {
          projectId,

          type: "move",

          target:
            "uploads/report.txt",

          metadata: {
            actionId:
              crypto.randomUUID(),

            destination:
              "archive/report.txt",
          },
        };

        console.log(
          "\n🤖 Agent: moving uploads/report.txt → archive/report.txt",
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

        // ---------------------------------------------
        // Verify move
        // ---------------------------------------------

        expect(
          await Bun.file(sourcePath).exists(),
        ).toBe(false);

        expect(
          await Bun.file(destinationPath).exists(),
        ).toBe(true);

        expect(
          await readFile(
            destinationPath,
            "utf8",
          ),
        ).toBe(
          originalContent,
        );

        // ---------------------------------------------
        // Undo
        // ---------------------------------------------

        console.log(
          "↩️ Agent: undoing move",
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

        // ---------------------------------------------
        // Verify reverse move
        // ---------------------------------------------

        expect(
          await Bun.file(sourcePath).exists(),
        ).toBe(true);

        expect(
          await Bun.file(destinationPath).exists(),
        ).toBe(false);

        expect(
          await readFile(
            sourcePath,
            "utf8",
          ),
        ).toBe(
          originalContent,
        );
      },
      45_000,
    );
  },
);