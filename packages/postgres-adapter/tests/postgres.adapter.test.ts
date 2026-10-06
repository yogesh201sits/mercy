import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import { Pool } from "pg";

import type {
  ActionInput,
} from "@mercy/core";

import {
  InMemoryActionGroupJournal,
} from "@mercy/journal";

import {
  LocalSnapshotStorage,
} from "@mercy/snapshots";

import {
  createPrismaClient,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../../postgres/src";

import {
  PostgresAdapter,
} from "../src";

import {
  MercyRuntime,
} from "../../runtime/src/runtime";

const projectId =
  `postgres-adapter-${crypto.randomUUID()}`;

const tableName =
  `mercy_test_users_${crypto.randomUUID().replaceAll("-", "_")}`;

const snapshotRoot =
  `${process.cwd()}/.test-postgres-snapshots/${crypto.randomUUID()}`;

// -------------------------------------------------------------
// Mercy persistence database
// -------------------------------------------------------------

const prisma =
  createPrismaClient();

// -------------------------------------------------------------
// Client PostgreSQL database
// -------------------------------------------------------------

const clientDatabaseUrl =
  process.env["CLIENT_DATABASE_URL"] ??
  process.env["DATABASE_URL"];

if (!clientDatabaseUrl) {
  throw new Error(
    "Set CLIENT_DATABASE_URL or DATABASE_URL to run PostgreSQL adapter integration tests.",
  );
}

const clientPool =
  new Pool({
    connectionString: clientDatabaseUrl,
  });

function createRuntime() {
  const actionJournal =
    new PostgresActionJournal(
      prisma,
    );

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

  const postgresAdapter =
    new PostgresAdapter({
      pool: clientPool,

      allowedTables: [
        tableName,
      ],
    });

  const runtime =
    new MercyRuntime({
      journal: actionJournal,

      groupJournal,

      snapshots,

      adapters: [
        postgresAdapter,
      ],
    });

  return {
    runtime,
    actionJournal,
    snapshots,
    snapshotStorage,
    postgresAdapter,
  };
}

describe(
  "PostgreSQL ActionAdapter",
  () => {
    let runtime:
      MercyRuntime;

    let actionJournal:
      PostgresActionJournal;

    let snapshots:
      PostgresSnapshotStore;

    beforeEach(
      async () => {
        await clientPool.query(
          `DROP TABLE IF EXISTS "${tableName}"`,
        );

        await clientPool.query(
          `
          CREATE TABLE "${tableName}" (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL
          )
          `,
        );

        const created =
          createRuntime();

        runtime =
          created.runtime;

        actionJournal =
          created.actionJournal;

        snapshots =
          created.snapshots;
      },
      45_000,
    );

    afterAll(
      async () => {
        await clientPool.query(
          `DROP TABLE IF EXISTS "${tableName}"`,
        );

        await clientPool.end();

        await prisma.$disconnect();
      },
    );

    // =========================================================
    // CREATE
    // =========================================================

    test(
      "creates a PostgreSQL row and undoes the action",
      async () => {
        const agentAction:
          ActionInput = {
            projectId,

            type: "create",

            target: tableName,

            metadata: {
              actionId:
                crypto.randomUUID(),

              primaryKey:
                "id",

              primaryKeyValue:
                1,

              data: {
                id: 1,
                name: "Yogesh",
                email:
                  "yogesh@example.com",
              },
            },
          };

        console.log(
          `\n🤖 Agent: creating row in ${tableName}`,
        );

        // -------------------------------------------------------
        // Execute
        // -------------------------------------------------------

        const result =
          await runtime.execute(
            agentAction,
          );

        expect(
          result.success,
        ).toBe(true);

        // -------------------------------------------------------
        // Verify database row
        // -------------------------------------------------------

        const created =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          created.rows,
        ).toHaveLength(1);

        expect(
          created.rows[0],
        ).toEqual({
          id: 1,
          name: "Yogesh",
          email:
            "yogesh@example.com",
        });

        // -------------------------------------------------------
        // Verify Mercy action
        // -------------------------------------------------------

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

        // -------------------------------------------------------
        // Verify snapshot
        // -------------------------------------------------------

        const snapshot =
          await snapshots.get(
            storedAction!
              .beforeSnapshotId!,
          );

        expect(
          snapshot,
        ).not.toBeNull();

        const snapshotData =
          await snapshots.read(
            storedAction!
              .beforeSnapshotId!,
          );

        const snapshotState =
          JSON.parse(
            new TextDecoder().decode(
              snapshotData,
            ),
          );

        expect(
          snapshotState.existed,
        ).toBe(false);

        // -------------------------------------------------------
        // Undo
        // -------------------------------------------------------

        console.log(
          "↩️ Agent: undoing PostgreSQL create",
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

        // -------------------------------------------------------
        // Verify row removed
        // -------------------------------------------------------

        const afterUndo =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          afterUndo.rows,
        ).toHaveLength(0);
      },
      45_000,
    );

    // =========================================================
    // UPDATE
    // =========================================================

    test(
      "updates a PostgreSQL row and restores the original state",
      async () => {
        await clientPool.query(
          `
          INSERT INTO "${tableName}"
            (id, name, email)
          VALUES
            ($1, $2, $3)
          `,
          [
            1,
            "Yogesh",
            "old@example.com",
          ],
        );

        const agentAction:
          ActionInput = {
            projectId,

            type: "update",

            target: tableName,

            metadata: {
              actionId:
                crypto.randomUUID(),

              primaryKey:
                "id",

              primaryKeyValue:
                1,

              changes: {
                name:
                  "Yogesh Jamdade",

                email:
                  "new@example.com",
              },
            },
          };

        console.log(
          `\n🤖 Agent: updating row in ${tableName}`,
        );

        // -------------------------------------------------------
        // Execute
        // -------------------------------------------------------

        const result =
          await runtime.execute(
            agentAction,
          );

        expect(
          result.success,
        ).toBe(true);

        // -------------------------------------------------------
        // Verify updated row
        // -------------------------------------------------------

        const updated =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          updated.rows[0],
        ).toEqual({
          id: 1,
          name:
            "Yogesh Jamdade",
          email:
            "new@example.com",
        });

        // -------------------------------------------------------
        // Verify snapshot contains old row
        // -------------------------------------------------------

        const storedAction =
          await actionJournal.get(
            result.actionId,
          );

        expect(
          storedAction,
        ).not.toBeNull();

        const snapshotId =
          storedAction!
            .beforeSnapshotId!;

        const snapshotData =
          await snapshots.read(
            snapshotId,
          );

        const snapshotState =
          JSON.parse(
            new TextDecoder().decode(
              snapshotData,
            ),
          );

        expect(
          snapshotState.existed,
        ).toBe(true);

        expect(
          snapshotState.data,
        ).toEqual({
          id: 1,
          name: "Yogesh",
          email:
            "old@example.com",
        });

        // -------------------------------------------------------
        // Undo
        // -------------------------------------------------------

        console.log(
          "↩️ Agent: undoing PostgreSQL update",
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

        // -------------------------------------------------------
        // Verify original row restored
        // -------------------------------------------------------

        const restored =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          restored.rows[0],
        ).toEqual({
          id: 1,
          name: "Yogesh",
          email:
            "old@example.com",
        });
      },
      45_000,
    );

    // =========================================================
    // DELETE
    // =========================================================

    test(
      "deletes a PostgreSQL row and restores it",
      async () => {
        await clientPool.query(
          `
          INSERT INTO "${tableName}"
            (id, name, email)
          VALUES
            ($1, $2, $3)
          `,
          [
            1,
            "Yogesh",
            "yogesh@example.com",
          ],
        );

        const agentAction:
          ActionInput = {
            projectId,

            type: "delete",

            target: tableName,

            metadata: {
              actionId:
                crypto.randomUUID(),

              primaryKey:
                "id",

              primaryKeyValue:
                1,
            },
          };

        console.log(
          `\n🤖 Agent: deleting row from ${tableName}`,
        );

        // -------------------------------------------------------
        // Execute
        // -------------------------------------------------------

        const result =
          await runtime.execute(
            agentAction,
          );

        expect(
          result.success,
        ).toBe(true);

        // -------------------------------------------------------
        // Verify deleted
        // -------------------------------------------------------

        const deleted =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          deleted.rows,
        ).toHaveLength(0);

        // -------------------------------------------------------
        // Verify snapshot
        // -------------------------------------------------------

        const storedAction =
          await actionJournal.get(
            result.actionId,
          );

        expect(
          storedAction,
        ).not.toBeNull();

        const snapshotData =
          await snapshots.read(
            storedAction!
              .beforeSnapshotId!,
          );

        const snapshotState =
          JSON.parse(
            new TextDecoder().decode(
              snapshotData,
            ),
          );

        expect(
          snapshotState.existed,
        ).toBe(true);

        expect(
          snapshotState.data,
        ).toEqual({
          id: 1,
          name: "Yogesh",
          email:
            "yogesh@example.com",
        });

        // -------------------------------------------------------
        // Undo
        // -------------------------------------------------------

        console.log(
          "↩️ Agent: undoing PostgreSQL delete",
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

        // -------------------------------------------------------
        // Verify restored
        // -------------------------------------------------------

        const restored =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          restored.rows[0],
        ).toEqual({
          id: 1,
          name: "Yogesh",
          email:
            "yogesh@example.com",
        });
      },
      45_000,
    );

    // =========================================================
    // CONFLICT
    // =========================================================

    test(
      "detects an external PostgreSQL modification before undo",
      async () => {
        await clientPool.query(
          `
          INSERT INTO "${tableName}"
            (id, name, email)
          VALUES
            ($1, $2, $3)
          `,
          [
            1,
            "Yogesh",
            "old@example.com",
          ],
        );

        const agentAction:
          ActionInput = {
            projectId,

            type: "update",

            target: tableName,

            metadata: {
              actionId:
                crypto.randomUUID(),

              primaryKey:
                "id",

              primaryKeyValue:
                1,

              changes: {
                name:
                  "Mercy Updated",
              },
            },
          };

        console.log(
          `\n🤖 Agent: updating row in ${tableName}`,
        );

        const result =
          await runtime.execute(
            agentAction,
          );

        expect(
          result.success,
        ).toBe(true);

        // -------------------------------------------------------
        // External application modifies the row
        // -------------------------------------------------------

        await clientPool.query(
          `
          UPDATE "${tableName}"
          SET name = $1
          WHERE id = $2
          `,
          [
            "External Update",
            1,
          ],
        );

        // -------------------------------------------------------
        // Attempt undo
        // -------------------------------------------------------

        console.log(
          "↩️ Agent: attempting undo after external modification",
        );

        const undo =
          await runtime.undo(
            result.actionId,
          );

        expect(
          undo.success,
        ).toBe(false);

        expect(
          undo.conflict,
        ).toBe(true);

        // -------------------------------------------------------
        // Mercy must NOT overwrite external change
        // -------------------------------------------------------

        const current =
          await clientPool.query(
            `
            SELECT *
            FROM "${tableName}"
            WHERE id = $1
            `,
            [1],
          );

        expect(
          current.rows[0],
        ).toEqual({
          id: 1,
          name:
            "External Update",
          email:
            "old@example.com",
        });
      },
      45_000,
    );
  },
);