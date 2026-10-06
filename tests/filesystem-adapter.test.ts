import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from "bun:test";

import type { Action } from "../packages/core/src";

import {
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";

import { join } from "node:path";

import { FilesystemAdapter } from "../packages/filesystem/src/filesystem-adapter";

const testRoot = join(
  process.cwd(),
  ".test-filesystem"
);

const adapter = new FilesystemAdapter(
  testRoot
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
        type: "update",
        target: "users",
        metadata: {
          primaryKey: "id"
        }
      })
    ).toBe(false);

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

    expect(
      adapter.canHandle({
        projectId: "project-1",
        type: "move",
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

  test("prepares a create action", async () => {
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

  test("prepares a rename action with reverse undo", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "rename",
        target: "old.txt",
        metadata: {
          actionId: "action-2",
          destination: "new.txt"
        }
      });

    expect(
      prepared.actionId
    ).toBe("action-2");

    expect(
      prepared.undoStrategy
    ).toBe("reverse");
  });

  test("writes a new file", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "created.txt",
        metadata: {
          actionId: "action-3",
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

    expect(
      result.afterHash
    ).toBeDefined();
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
          actionId: "action-4",
          content: "after"
        }
      });

    const result =
      await adapter.execute(prepared);

    expect(result.success).toBe(true);

    const content =
      await readFile(
        join(testRoot, "update.txt"),
        "utf8"
      );

    expect(content).toBe("after");

    expect(
      result.afterHash
    ).toBeDefined();
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
          actionId: "action-5"
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
          actionId: "action-6",
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

    await expect(
      readFile(
        join(testRoot, "old.txt")
      )
    ).rejects.toThrow();
  });

  test("rejects absolute filesystem targets", async () => {
    await expect(
      adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "C:\\outside.txt",
        metadata: {
          actionId: "action-7",
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
          actionId: "action-8",
          content: "unsafe"
        }
      })
    ).rejects.toThrow(
      "Filesystem target escapes the root directory"
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
      "Filesystem action requires metadata.actionId"
    );
  });

  test("rejects missing content for create", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "missing-content.txt",
        metadata: {
          actionId: "action-9"
        }
      });

    await expect(
      adapter.execute(prepared)
    ).rejects.toThrow(
      "create requires metadata.content"
    );
  });

  test("rejects missing content for update", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "update",
        target: "missing-content.txt",
        metadata: {
          actionId: "action-10"
        }
      });

    await expect(
      adapter.execute(prepared)
    ).rejects.toThrow(
      "update requires metadata.content"
    );
  });

  test("rejects missing destination for rename", async () => {
    await expect(
      adapter.prepare({
        projectId: "project-1",
        type: "rename",
        target: "old.txt",
        metadata: {
          actionId: "action-11"
        }
      })
    ).rejects.toThrow(
      "rename requires metadata.destination"
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
          actionId: "action-12",
          content: "changed"
        }
      });

    const captured =
      await adapter.snapshot(prepared);

    expect(captured.data).toBeInstanceOf(
      Uint8Array
    );

    expect(
      new TextDecoder().decode(
        captured.data
      )
    ).toBe("original");

    expect(
      captured.metadata
    ).toEqual({
      exists: true,
      path: "snapshot.txt",
      size: 8,
      mode: expect.any(Number)
    });
  });

  test("captures missing file state", async () => {
    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "create",
        target: "does-not-exist.txt",
        metadata: {
          actionId: "action-13",
          content: "new file"
        }
      });

    const captured =
      await adapter.snapshot(prepared);

    expect(
      captured.data.byteLength
    ).toBe(0);

    expect(
      captured.metadata
    ).toEqual({
      exists: false,
      path: "does-not-exist.txt"
    });
  });

  test("verifies an unchanged file", async () => {
    await writeFile(
      join(testRoot, "verify.txt"),
      "verify me"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "update",
        target: "verify.txt",
        metadata: {
          actionId: "action-14",
          content: "changed"
        }
      });

    const execution =
      await adapter.execute(prepared);

    const action: Action = {
      id: "action-14",
      projectId: "project-1",
      type: "update",
      target: "verify.txt",
      status: "completed",
      undoStrategy: "restore",
      createdAt: new Date(),

      ...(execution.afterHash
        ? {
            afterHash: execution.afterHash
          }
        : {})
    };

    const verification =
      await adapter.verify(action);

    expect(
      verification.conflict
    ).toBe(false);

    expect(
      verification.valid
    ).toBe(true);
  });

  test("detects a file changed after execution", async () => {
    await writeFile(
      join(testRoot, "conflict.txt"),
      "initial"
    );

    const prepared =
      await adapter.prepare({
        projectId: "project-1",
        type: "update",
        target: "conflict.txt",
        metadata: {
          actionId: "action-15",
          content: "changed"
        }
      });

    const execution =
      await adapter.execute(prepared);

    expect(execution.success).toBe(true);
    expect(execution.afterHash).toBeDefined();

    await writeFile(
      join(testRoot, "conflict.txt"),
      "externally changed"
    );

    const action: Action = {
      id: "action-15",
      projectId: "project-1",
      type: "update",
      target: "conflict.txt",
      status: "completed",
      undoStrategy: "restore",
      createdAt: new Date(),

      ...(execution.afterHash
        ? {
            afterHash: execution.afterHash
          }
        : {})
    };

    const verification =
      await adapter.verify(action);

    expect(
      verification.valid
    ).toBe(false);

    expect(
      verification.conflict
    ).toBe(true);

    expect(
      verification.reason
    ).toBe(
      "Resource changed after the action completed."
    );
  });
});