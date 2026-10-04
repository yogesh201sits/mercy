import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from "bun:test";

import {
  mkdir,
  rm
} from "node:fs/promises";

import {
  join
} from "node:path";

import {
  LocalSnapshotStorage
} from "../packages/snapshots/src/storage/local-storage";

const testDirectory = join(
  process.cwd(),
  ".test-snapshots"
);

const storage = new LocalSnapshotStorage(
  testDirectory
);

beforeAll(async () => {
  await mkdir(testDirectory, {
    recursive: true
  });
});

afterAll(async () => {
  await rm(testDirectory, {
    recursive: true,
    force: true
  });
});

describe("LocalSnapshotStorage", () => {
  test("stores and reads snapshot data", async () => {
    const data = new TextEncoder().encode(
      "hello mercy"
    );

    await storage.put(
      "action-1/snapshot-1",
      data
    );

    const result = await storage.get(
      "action-1/snapshot-1"
    );

    expect(
      new TextDecoder().decode(result)
    ).toBe("hello mercy");
  });

  test("checks whether snapshot exists", async () => {
    expect(
      await storage.exists(
        "action-1/snapshot-1"
      )
    ).toBe(true);

    expect(
      await storage.exists(
        "missing/snapshot"
      )
    ).toBe(false);
  });

  test("deletes snapshot", async () => {
    await storage.put(
      "action-2/snapshot-1",
      new Uint8Array([1, 2, 3])
    );

    expect(
      await storage.exists(
        "action-2/snapshot-1"
      )
    ).toBe(true);

    await storage.delete(
      "action-2/snapshot-1"
    );

    expect(
      await storage.exists(
        "action-2/snapshot-1"
      )
    ).toBe(false);
  });

  test("rejects absolute paths", async () => {
    expect(
      storage.put(
        "C:\\outside.snapshot",
        new Uint8Array([1])
      )
    ).rejects.toThrow(
      "Snapshot storage key must be relative"
    );
  });

  test("rejects path traversal", async () => {
    expect(
      storage.put(
        "../../outside.snapshot",
        new Uint8Array([1])
      )
    ).rejects.toThrow(
      "Snapshot storage key escapes the snapshot directory"
    );
  });

  test("rejects traversal from nested path", async () => {
    expect(
      storage.put(
        "action-1/../../outside.snapshot",
        new Uint8Array([1])
      )
    ).rejects.toThrow(
      "Snapshot storage key escapes the snapshot directory"
    );
  });

  test("throws MercyError when snapshot is missing", async () => {
    expect(
      storage.get(
        "missing/snapshot"
      )
    ).rejects.toThrow(
      "Snapshot not found: missing/snapshot"
    );
  });
});