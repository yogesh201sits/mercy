import { describe, expect, it } from "bun:test";

import { createPrismaClient } from "../packages/postgres/src";
import { mapPrismaError } from "../packages/postgres/src/errors";
import { PostgresActionJournal } from "../packages/postgres/src/journal/action-journal";
import { PostgresSnapshotRepository } from "../packages/postgres/src/repositories/snapshot-repository";

const prisma = createPrismaClient();
const journal = new PostgresActionJournal(prisma);
const snapshots = new PostgresSnapshotRepository(prisma);

describe("PostgreSQL error mapping", () => {
  it("maps missing action updates to ACTION_NOT_FOUND", async () => {
    await expect(
      journal.markRunning(crypto.randomUUID()),
    ).rejects.toMatchObject({
      code: "ACTION_NOT_FOUND",
      message: "Action not found",
    });
  });

  it("maps missing undo updates to ACTION_NOT_FOUND", async () => {
    await expect(
      journal.markUndoing(crypto.randomUUID()),
    ).rejects.toMatchObject({
      code: "ACTION_NOT_FOUND",
      message: "Action not found",
    });
  });

  it("maps missing snapshot deletes to SNAPSHOT_NOT_FOUND", async () => {
    await expect(snapshots.delete(crypto.randomUUID())).rejects.toMatchObject({
      code: "SNAPSHOT_NOT_FOUND",
      message: "Snapshot not found",
    });
  });

  it("rethrows errors other than missing-record errors", () => {
    const error = new Error("Database unavailable");

    expect(() => mapPrismaError(error, "action")).toThrow(error);
  });
});
