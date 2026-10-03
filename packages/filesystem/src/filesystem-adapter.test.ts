import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from "bun:test";

import {
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";

import { join } from "node:path";

import type {
  Snapshot,
  SnapshotStore
} from "@mercy/core";

import { FilesystemAdapter } from "./filesystem-adapter";

const testRoot = join(
  process.cwd(),
  ".test-filesystem"
);

class TestSnapshotStore implements SnapshotStore {
  private readonly snapshots = new Map<
    string,
    {
      snapshot: Snapshot;
      data: Uint8Array;
    }
  >();

  async create(input: {
    readonly actionId: string;
    readonly data: Uint8Array;
    readonly metadata?: Readonly<
      Record<string, unknown>
    >;
  }): Promise<Snapshot> {
    const id = crypto.randomUUID();

    const snapshot: Snapshot = {
      id,
      actionId: input.actionId,
      storageKey: `${input.actionId}/${id}.snapshot`,
      checksum: "test-checksum",
      size: input.data.byteLength,
      createdAt: new Date(),
      ...(input.metadata
        ? { metadata: input.metadata }
        : {})
    };

    this.snapshots.set(id, {
      snapshot,
      data: input.data
    });

    return snapshot;
  }

  async get(
    snapshotId: string
  ): Promise<Snapshot | null> {
    return (
      this.snapshots.get(snapshotId)
        ?.snapshot ?? null
    );
  }

  async read(
    snapshotId: string
  ): Promise<Uint8Array> {
    const entry =
      this.snapshots.get(snapshotId);

    if (!entry) {
      throw new Error(
        `Snapshot not found: ${snapshotId}`
      );
    }

    return entry.data;
  }

  async delete(
    snapshotId: string
  ): Promise<void> {
    this.snapshots.delete(snapshotId);
  }
}

const snapshotStore =
  new TestSnapshotStore();

const adapter =
  new FilesystemAdapter(
    testRoot,
    snapshotStore
  );

beforeAll(async () => {
  await mkdir(testRoot, {
    recursive: true
  });
});

afterAll(async () => {
  await rm(testRoot, {
    recursive: true,
    force: true
  });
});

describe("FilesystemAdapter", () => {
  test("handles filesystem actions", () => {
    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "create",
        target: "hello.txt"
      })
    ).toBe(true);

    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "update",
        target: "hello.txt"
      })
    ).toBe(true);

    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "delete",
        target: "hello.txt"
      })
    ).toBe(true);

    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "rename",
        target: "hello.txt"
      })
    ).toBe(true);
  });

  test("rejects unsupported actions", () => {
    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "custom",
        target: "hello.txt"
      })
    ).toBe(false);
  });

  test("prepares a write action", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "hello.txt",
        metadata: {
          actionId: "action-1",
          content: "hello"
        }
      });

    expect(
      prepared.actionId
    ).toBe("action-1");

    expect(
      prepared.undoStrategy
    ).toBe("restore");
  });

  test("writes a new file", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "created.txt",
        metadata: {
          actionId: "action-2",
          content: "hello mercy"
        }
      });

    const result =
      await adapter.execute(prepared);

    expect(result.success).toBe(true);

    const content =
      await readFile(
        join(testRoot, "created.txt"),
        "utf8"
      );

    expect(content).toBe(
      "hello mercy"
    );
  });

  test("updates an existing file", async () => {
    await writeFile(
      join(testRoot, "update.txt"),
      "before"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "update",
        target: "update.txt",
        metadata: {
          actionId: "action-3",
          content: "after"
        }
      });

    await adapter.execute(prepared);

    const content =
      await readFile(
        join(testRoot, "update.txt"),
        "utf8"
      );

    expect(content).toBe("after");
  });

  test("deletes a file", async () => {
    await writeFile(
      join(testRoot, "delete.txt"),
      "delete me"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "delete",
        target: "delete.txt",
        metadata: {
          actionId: "action-4"
        }
      });

    const result =
      await adapter.execute(prepared);

    expect(result.success).toBe(true);

    await expect(
      readFile(
        join(testRoot, "delete.txt")
      )
    ).rejects.toThrow();
  });

  test("renames a file", async () => {
    await writeFile(
      join(testRoot, "old.txt"),
      "rename me"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "rename",
        target: "old.txt",
        metadata: {
          actionId: "action-5",
          destination: "new.txt"
        }
      });

    const result =
      await adapter.execute(prepared);

    expect(result.success).toBe(true);

    const content =
      await readFile(
        join(testRoot, "new.txt"),
        "utf8"
      );

    expect(content).toBe(
      "rename me"
    );
  });

  test("rejects absolute filesystem targets", async () => {
    await expect(
      adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "C:\\outside.txt",
        metadata: {
          actionId: "action-6",
          content: "unsafe"
        }
      })
    ).rejects.toThrow(
      "Filesystem target must be relative"
    );
  });

  test("rejects filesystem path traversal", async () => {
    await expect(
      adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "../../outside.txt",
        metadata: {
          actionId: "action-7",
          content: "unsafe"
        }
      })
    ).rejects.toThrow(
      "Filesystem target escapes the project directory"
    );
  });

  test("rejects missing action id", async () => {
    await expect(
      adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "hello.txt",
        metadata: {
          content: "hello"
        }
      })
    ).rejects.toThrow(
      "Filesystem action requires an actionId"
    );
  });
  test("captures the previous file state", async () => {
    await writeFile(
      join(testRoot, "snapshot.txt"),
      "original"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "update",
        target: "snapshot.txt",
        metadata: {
          actionId: "action-8",
          content: "changed"
        }
      });

    const snapshot =
      await adapter.snapshot(prepared);

    expect(snapshot.actionId).toBe(
      "action-8"
    );

    expect(snapshot.metadata).toEqual({
      exists: true,
      path: "snapshot.txt",
      size: 8,
      mode: expect.any(Number)
    });

    const data =
      await snapshotStore.read(
        snapshot.id
      );

    expect(
      new TextDecoder().decode(data)
    ).toBe("original");
  });
});