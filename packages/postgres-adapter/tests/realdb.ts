import { Pool } from "pg";

import type { ActionInput } from "@mercy/core";

import {
  InMemoryActionGroupJournal,
} from "@mercy/journal";

import {
  LocalSnapshotStorage,
} from "@mercy/snapshots";

import "dotenv/config";

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

// =============================================================
// Configuration
// =============================================================

const databaseUrl =
  process.env["CLIENT_DATABASE_URL"]

if (!databaseUrl) {
  throw new Error(
    "Set CLIENT_DATABASE_URL or DATABASE_URL.",
  );
}

const projectId =
  `real-db-${crypto.randomUUID()}`;

const tableName =
  `mercy_real_users_${crypto.randomUUID().replaceAll("-", "_")}`;

const snapshotRoot =
  `${process.cwd()}/.real-db-snapshots/${crypto.randomUUID()}`;

// =============================================================
// Mercy persistence database
// =============================================================

const prisma =
  createPrismaClient();

// =============================================================
// Client PostgreSQL database
// =============================================================

const clientPool =
  new Pool({
    connectionString: databaseUrl,
  });

// =============================================================
// Runtime
// =============================================================

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

// =============================================================
// Helpers
// =============================================================

function printRow(
  label: string,
  row: unknown,
) {
  console.log(`\n${label}`);
  console.log(
    JSON.stringify(
      row,
      null,
      2,
    ),
  );
}

async function getUser() {
  const result =
    await clientPool.query(
      `
      SELECT *
      FROM "${tableName}"
      WHERE id = $1
      `,
      [1],
    );

  return result.rows[0] ?? null;
}

async function assertDatabaseConnection() {
  const result =
    await clientPool.query(
      "SELECT current_database(), current_user",
    );

  console.log("\n========================================");
  console.log(" PostgreSQL Connection");
  console.log("========================================");

  console.log(
    `Database: ${result.rows[0].current_database}`,
  );

  console.log(
    `User:     ${result.rows[0].current_user}`,
  );
}

// =============================================================
// CREATE
// =============================================================

async function testCreate() {
  console.log("\n========================================");
  console.log(" CREATE + UNDO");
  console.log("========================================");

  const action: ActionInput = {
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
        email: "yogesh@example.com",
      },
    },
  };

  console.log(
    `\n🤖 Agent: creating user`,
  );

  const result =
    await runtime.execute(
      action,
    );

  console.log(
    "\nMercy execute result:",
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );

  printRow(
    "Database after CREATE:",
    await getUser(),
  );

  console.log(
    "\n↩️ Agent: undoing CREATE",
  );

  const undo =
    await runtime.undo(
      result.actionId,
    );

  console.log(
    "\nMercy undo result:",
  );

  console.log(
    JSON.stringify(
      undo,
      null,
      2,
    ),
  );

  printRow(
    "Database after UNDO:",
    await getUser(),
  );
}

// =============================================================
// UPDATE
// =============================================================

async function testUpdate() {
  console.log("\n========================================");
  console.log(" UPDATE + UNDO");
  console.log("========================================");

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

  printRow(
    "Database before UPDATE:",
    await getUser(),
  );

  const action: ActionInput = {
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
    "\n🤖 Agent: updating user",
  );

  const result =
    await runtime.execute(
      action,
    );

  console.log(
    "\nMercy execute result:",
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );

  printRow(
    "Database after UPDATE:",
    await getUser(),
  );

  console.log(
    "\n↩️ Agent: undoing UPDATE",
  );

  const undo =
    await runtime.undo(
      result.actionId,
    );

  console.log(
    "\nMercy undo result:",
  );

  console.log(
    JSON.stringify(
      undo,
      null,
      2,
    ),
  );

  printRow(
    "Database after UNDO:",
    await getUser(),
  );

  await clientPool.query(
    `
    DELETE FROM "${tableName}"
    WHERE id = $1
    `,
    [1],
  );
}

// =============================================================
// DELETE
// =============================================================

async function testDelete() {
  console.log("\n========================================");
  console.log(" DELETE + UNDO");
  console.log("========================================");

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

  printRow(
    "Database before DELETE:",
    await getUser(),
  );

  const action: ActionInput = {
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
    "\n🤖 Agent: deleting user",
  );

  const result =
    await runtime.execute(
      action,
    );

  console.log(
    "\nMercy execute result:",
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );

  printRow(
    "Database after DELETE:",
    await getUser(),
  );

  console.log(
    "\n↩️ Agent: undoing DELETE",
  );

  const undo =
    await runtime.undo(
      result.actionId,
    );

  console.log(
    "\nMercy undo result:",
  );

  console.log(
    JSON.stringify(
      undo,
      null,
      2,
    ),
  );

  printRow(
    "Database after UNDO:",
    await getUser(),
  );

  await clientPool.query(
    `
    DELETE FROM "${tableName}"
    WHERE id = $1
    `,
    [1],
  );
}

// =============================================================
// CONFLICT
// =============================================================

async function testConflict() {
  console.log("\n========================================");
  console.log(" CONFLICT DETECTION");
  console.log("========================================");

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

  printRow(
    "Database before UPDATE:",
    await getUser(),
  );

  const action: ActionInput = {
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
    "\n🤖 Agent: updating user",
  );

  const result =
    await runtime.execute(
      action,
    );

  printRow(
    "Database after Mercy UPDATE:",
    await getUser(),
  );

  // -----------------------------------------------------------
  // External modification
  // -----------------------------------------------------------

  console.log(
    "\n⚠️ External application modifies the row",
  );

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

  printRow(
    "Database after EXTERNAL UPDATE:",
    await getUser(),
  );

  // -----------------------------------------------------------
  // Attempt undo
  // -----------------------------------------------------------

  console.log(
    "\n↩️ Agent: attempting UNDO",
  );

  const undo =
    await runtime.undo(
      result.actionId,
    );

  console.log(
    "\nMercy undo result:",
  );

  console.log(
    JSON.stringify(
      undo,
      null,
      2,
    ),
  );

  printRow(
    "Database after attempted UNDO:",
    await getUser(),
  );

  await clientPool.query(
    `
    DELETE FROM "${tableName}"
    WHERE id = $1
    `,
    [1],
  );
}

// =============================================================
// Main
// =============================================================

async function main() {
  try {
    await assertDatabaseConnection();

    console.log("\n========================================");
    console.log(" Creating real PostgreSQL table");
    console.log("========================================");

    console.log(
      `Table: ${tableName}`,
    );

    await clientPool.query(
      `
      DROP TABLE IF EXISTS "${tableName}"
      `,
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

    console.log(
      "✓ Table created",
    );

    // -----------------------------------------------------------
    // Run scenarios
    // -----------------------------------------------------------

    await testCreate();

    await testUpdate();

    await testDelete();

    await testConflict();

    // -----------------------------------------------------------
    // Final database state
    // -----------------------------------------------------------

    console.log("\n========================================");
    console.log(" Final Database State");
    console.log("========================================");

    const final =
      await clientPool.query(
        `SELECT * FROM "${tableName}"`,
      );

    console.table(
      final.rows,
    );

    console.log(
      "\n✓ Real PostgreSQL Mercy verification completed.",
    );
  } catch (error) {
    console.error(
      "\n✗ Real PostgreSQL verification failed:",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    // -----------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------

    try {
      await clientPool.query(
        `
        DROP TABLE IF EXISTS "${tableName}"
        `,
      );
    } catch {
      // Ignore cleanup errors.
    }

    await clientPool.end();

    await prisma.$disconnect();
  }
}

await main();