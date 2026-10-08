import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(
    new URL("../.env", import.meta.url),
  ),
});

import { Pool } from "pg";

import {
  PostgresActionGroupJournal,
  PostgresActionJournal,
  PostgresApiKeyStore,
  PostgresProjectStore,
  PostgresSnapshotStore,
  createPrismaClient,
} from "@mercy/postgres";

import {
  LocalSnapshotStorage,
} from "@mercy/snapshots";

import {
  PostgresAdapter,
} from "@mercy/postgres-adapter";

import {
  FilesystemAdapter,
} from "@mercy/filesystem";

import {
  MercyRuntime,
} from "@mercy/runtime";

export interface MercyApiRuntime {
  readonly runtime: MercyRuntime;
  readonly prisma: ReturnType<typeof createPrismaClient>;
  readonly clientPool: Pool;
  readonly snapshotStorage: LocalSnapshotStorage;
  readonly projects: PostgresProjectStore;
  readonly apiKeys: PostgresApiKeyStore;
}

export function createMercyRuntime(): MercyApiRuntime {
  const prisma = createPrismaClient();

  const clientDatabaseUrl =
    process.env["CLIENT_DATABASE_URL"];

  if (!clientDatabaseUrl) {
    throw new Error(
      "CLIENT_DATABASE_URL must be set",
    );
  }

  const clientPool = new Pool({
    connectionString: clientDatabaseUrl,
  });

  const snapshotRoot =
    `${process.cwd()}/.real-db-snapshots`;

  const workspaceRoot =
    `${process.cwd()}/.test-agent-simulation`;

  const snapshotStorage =
    new LocalSnapshotStorage(snapshotRoot);

  const journal =
    new PostgresActionJournal(prisma);

  const groupJournal =
    new PostgresActionGroupJournal(prisma);

  const snapshots =
    new PostgresSnapshotStore(
      prisma,
      snapshotStorage,
    );

  const projects =
    new PostgresProjectStore(prisma);

  const apiKeys =
    new PostgresApiKeyStore(prisma);

  const filesystemAdapter =
    new FilesystemAdapter(workspaceRoot);

  const postgresAdapter =
    new PostgresAdapter({
      pool: clientPool,
    });

  const runtime =
    new MercyRuntime({
      journal,
      groupJournal,
      snapshots,
      adapters: [
        filesystemAdapter,
        postgresAdapter,
      ],
    });

  return {
    runtime,
    prisma,
    clientPool,
    snapshotStorage,
    projects,
    apiKeys,
  };
}