import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { LocalSnapshotStorage } from "@mercy/snapshots";
import { config } from "dotenv";
import { Pool } from "pg";

import {
  createPrismaClient,
  PostgresActionGroupJournal,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../../postgres/src";
import { MercyRuntime } from "../../runtime/src";

import { PostgresAdapter } from "../src";

config({
  path: fileURLToPath(new URL("./.env", import.meta.url)),
});

describe("PostgreSQL action groups", () => {
  const prisma = createPrismaClient();
  const clientDatabaseUrl =
    process.env.CLIENT_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!clientDatabaseUrl) {
    throw new Error(
      "Set CLIENT_DATABASE_URL or DATABASE_URL to run PostgreSQL action group integration tests.",
    );
  }

  const clientPool = new Pool({
    connectionString: clientDatabaseUrl,
  });

  const tableName = `mercy_group_users_${crypto
    .randomUUID()
    .replaceAll("-", "_")}`;

  const projectId = `group-test-${crypto.randomUUID()}`;

  let runtime: MercyRuntime;

  beforeAll(async () => {
    await clientPool.query(`
      CREATE TABLE "${tableName}" (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )
    `);

    await clientPool.query(`
      INSERT INTO "${tableName}" (
        id,
        name,
        email
      )
      VALUES
        (1, 'Alice', 'alice@test.com'),
        (2, 'Bob', 'bob@test.com'),
        (3, 'Charlie', 'charlie@test.com')
    `);

    const journal = new PostgresActionJournal(prisma);

    const groupJournal = new PostgresActionGroupJournal(prisma);

    const snapshotRoot = `${process.cwd()}/.test-snapshots/${crypto.randomUUID()}`;

    const snapshotStorage = new LocalSnapshotStorage(snapshotRoot);

    const snapshots = new PostgresSnapshotStore(prisma, snapshotStorage);

    const adapter = new PostgresAdapter({
      pool: clientPool,
      allowedTables: [tableName],
    });

    runtime = new MercyRuntime({
      journal,
      groupJournal,
      snapshots,
      adapters: [adapter],
    });
  });

  afterAll(async () => {
    await clientPool.query(`DROP TABLE IF EXISTS "${tableName}"`);

    await clientPool.end();
    await prisma.$disconnect();
  });

  test("executes and undoes PostgreSQL actions as a group", async () => {
    const group = await runtime.startGroup({
      projectId,
    });

    expect(group.status).toBe("pending");
    expect(group.actionIds).toEqual([]);

    // 1. UPDATE Alice
    const updateAlice = await runtime.execute(
      {
        projectId,
        type: "update",
        target: tableName,
        metadata: {
          primaryKey: "id",
          primaryKeyValue: 1,
          changes: {
            name: "Alice Updated",
          },
        },
      },
      group.id,
    );

    expect(updateAlice.success).toBe(true);

    // 2. DELETE Bob
    const deleteBob = await runtime.execute(
      {
        projectId,
        type: "delete",
        target: tableName,
        metadata: {
          primaryKey: "id",
          primaryKeyValue: 2,
        },
      },
      group.id,
    );

    expect(deleteBob.success).toBe(true);

    // 3. UPDATE Charlie
    const updateCharlie = await runtime.execute(
      {
        projectId,
        type: "update",
        target: tableName,
        metadata: {
          primaryKey: "id",
          primaryKeyValue: 3,
          changes: {
            email: "charlie-updated@test.com",
          },
        },
      },
      group.id,
    );

    expect(updateCharlie.success).toBe(true);

    const runningGroup = await runtime.getGroup(group.id);

    expect(runningGroup.actionIds).toHaveLength(3);
    expect(runningGroup.status).toBe("running");

    await runtime.completeGroup(group.id);

    const completedGroup = await runtime.getGroup(group.id);

    expect(completedGroup.status).toBe("completed");

    const changed = await clientPool.query(`
          SELECT id, name, email
          FROM "${tableName}"
          ORDER BY id
        `);

    expect(changed.rows).toEqual([
      {
        id: 1,
        name: "Alice Updated",
        email: "alice@test.com",
      },
      {
        id: 3,
        name: "Charlie",
        email: "charlie-updated@test.com",
      },
    ]);

    // Undo group.
    const undoResult = await runtime.undoGroup(group.id);

    expect(undoResult.success).toBe(true);
    expect(undoResult.conflict).toBe(false);
    expect(undoResult.results).toHaveLength(3);

    for (const result of undoResult.results) {
      expect(result.success).toBe(true);
      expect(result.conflict).toBe(false);
    }

    const restored = await clientPool.query(`
          SELECT id, name, email
          FROM "${tableName}"
          ORDER BY id
        `);

    expect(restored.rows).toEqual([
      {
        id: 1,
        name: "Alice",
        email: "alice@test.com",
      },
      {
        id: 2,
        name: "Bob",
        email: "bob@test.com",
      },
      {
        id: 3,
        name: "Charlie",
        email: "charlie@test.com",
      },
    ]);

    const undoneGroup = await runtime.getGroup(group.id);

    expect(undoneGroup.status).toBe("undone");
  }, 60_000);
});
