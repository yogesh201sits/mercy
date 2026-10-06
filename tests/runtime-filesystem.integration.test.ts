import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MercyRuntime } from "../packages/runtime/src";
import { FilesystemAdapter } from "../packages/filesystem/src";
import { LocalSnapshotStorage } from "../packages/snapshots/src";
import { InMemoryActionGroupJournal } from "../packages/journal/src/groups";
import { PostgresActionJournal, PostgresSnapshotStore, createPrismaClient } from "../packages/postgres/src";

describe("MercyRuntime + Filesystem integration", () => {
  const prisma = createPrismaClient();

  let rootDir: string;
  let snapshotDir: string;
  let runtime: MercyRuntime;

  const projectId = `integration-${crypto.randomUUID()}`;

  beforeAll(async () => {
    rootDir = await mkdtemp(join(tmpdir(), "mercy-filesystem-"));
    snapshotDir = await mkdtemp(join(tmpdir(), "mercy-snapshots-"));

    const journal = new PostgresActionJournal(prisma);
    const groupJournal = new InMemoryActionGroupJournal();


    const snapshotStorage = new LocalSnapshotStorage(snapshotDir);
    const snapshots = new PostgresSnapshotStore(
      prisma,
      snapshotStorage
    );

    const filesystem = new FilesystemAdapter(rootDir);

    runtime = new MercyRuntime({
      journal,
      groupJournal,
      snapshots,
      adapters: [filesystem]
    });
  });

  afterAll(async () => {
    await prisma.action.deleteMany({
      where: {
        projectId
      }
    });

    await rm(rootDir, {
      recursive: true,
      force: true
    });

    await rm(snapshotDir, {
      recursive: true,
      force: true
    });

    await prisma.$disconnect();
  });

  test("executes and undoes a filesystem create", async () => {
    const target = "created.txt";

    const result = await runtime.execute({
      projectId,
      type: "create",
      target,
      metadata: {
        content: "hello mercy"
      }
    });

    expect(result.success).toBe(true);
    expect(result.actionId).toBeDefined();

    const filePath = join(rootDir, target);

    expect(await readFile(filePath, "utf8")).toBe("hello mercy");

    const action = await runtime.getAction(result.actionId);

    expect(action).not.toBeNull();
    expect(action?.status).toBe("completed");
    expect(action?.beforeSnapshotId).toBeDefined();
    expect(action?.afterHash).toBeDefined();

    const undoResult = await runtime.undo(result.actionId);

    expect(undoResult.success).toBe(true);
    expect(undoResult.conflict).toBe(false);

    await expect(readFile(filePath, "utf8")).rejects.toThrow();

    const undoneAction = await runtime.getAction(result.actionId);

    expect(undoneAction?.status).toBe("undone");
    expect(undoneAction?.undoResult?.success).toBe(true);
  },15_000);

  test("restores the previous content after an update", async () => {
    const target = "updated.txt";
    const filePath = join(rootDir, target);

    await writeFile(filePath, "original");

    const result = await runtime.execute({
      projectId,
      type: "update",
      target,
      metadata: {
        content: "updated"
      }
    });

    expect(result.success).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("updated");

    const undoResult = await runtime.undo(result.actionId);

    expect(undoResult.success).toBe(true);
    expect(undoResult.conflict).toBe(false);

    expect(await readFile(filePath, "utf8")).toBe("original");
  },15_000);

  test("restores a deleted file", async () => {
    const target = "deleted.txt";
    const filePath = join(rootDir, target);

    await writeFile(filePath, "restore me");

    const result = await runtime.execute({
      projectId,
      type: "delete",
      target
    });

    expect(result.success).toBe(true);

    await expect(readFile(filePath, "utf8")).rejects.toThrow();

    const undoResult = await runtime.undo(result.actionId);

    expect(undoResult.success).toBe(true);

    expect(await readFile(filePath, "utf8")).toBe("restore me");
  });

  test("detects an external filesystem change before undo", async () => {
    const target = "conflict.txt";
    const filePath = join(rootDir, target);

    await writeFile(filePath, "original");

    const result = await runtime.execute({
      projectId,
      type: "update",
      target,
      metadata: {
        content: "mercy update"
      }
    });

    expect(result.success).toBe(true);

    await writeFile(filePath, "changed externally");

    const undoResult = await runtime.undo(result.actionId);

    expect(undoResult.success).toBe(false);
    expect(undoResult.conflict).toBe(true);

    expect(await readFile(filePath, "utf8")).toBe("changed externally");
  });
});