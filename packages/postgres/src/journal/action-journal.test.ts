import { describe, expect, it } from "bun:test";

import type {
  ActionResult,
  UndoResult
} from "@mercy/core";

import { createPrismaClient } from "../client/client";
import { PostgresActionJournal } from "./action-journal";

const prisma = createPrismaClient();

describe("PostgresActionJournal", () => {
  const journal =
    new PostgresActionJournal(prisma);

  const projectId =
    `test-project-${crypto.randomUUID()}`;

  it("creates a pending action", async () => {
    const actionId =
      crypto.randomUUID();

    const entry =
      await journal.create({
        id: actionId,
        input: {
          projectId,
          type: "create",
          target: "test.txt"
        },
        undoStrategy: "restore"
      });

    expect(entry.id).toBe(actionId);
    expect(entry.projectId).toBe(projectId);
    expect(entry.status).toBe("pending");
    expect(entry.target).toBe("test.txt");
    expect(entry.undoStrategy).toBe(
      "restore"
    );
  });

  it("records snapshot creation", async () => {
    const actionId =
      crypto.randomUUID();

    const entry =
      await journal.create({
        id: actionId,
        input: {
          projectId,
          type: "update",
          target: "test.txt"
        },
        undoStrategy: "restore"
      });

    const snapshotId =
      crypto.randomUUID();

    const updated =
      await journal.markSnapshotCreated(
        actionId,
        snapshotId
      );

    expect(
      updated.beforeSnapshotId
    ).toBe(snapshotId);
  });

  it("marks an action as running", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "create",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    const updated =
      await journal.markRunning(
        actionId
      );

    expect(updated.status).toBe(
      "running"
    );
    expect(
      updated.startedAt
    ).toBeInstanceOf(Date);
  });

  it("marks an action as completed", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "update",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    const result: ActionResult = {
      actionId,
      success: true,
      result: {
        path: "test.txt"
      }
    };

    const updated =
      await journal.markCompleted(
        actionId,
        result,
        "after-hash"
      );

    expect(updated.status).toBe(
      "completed"
    );
    expect(updated.afterHash).toBe(
      "after-hash"
    );
    expect(updated.result).toEqual(
      result
    );
    expect(
      updated.completedAt
    ).toBeInstanceOf(Date);
  });

  it("marks an action as failed", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "delete",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    const updated =
      await journal.markFailed(
        actionId,
        "File not found"
      );

    expect(updated.status).toBe(
      "failed"
    );

    expect(updated.result).toEqual({
      actionId,
      success: false,
      error: "File not found"
    });
  });

  it("records successful undo", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "delete",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    await journal.markUndoing(
      actionId
    );

    const result: UndoResult = {
      actionId,
      success: true,
      conflict: false
    };

    const updated =
      await journal.markUndone(
        actionId,
        result
      );

    expect(updated.status).toBe(
      "undone"
    );
    expect(
      updated.undoResult
    ).toEqual(result);
  });

  it("records failed undo", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "delete",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    await journal.markUndoing(
      actionId
    );

    const updated =
      await journal.markUndoFailed(
        actionId,
        "Resource changed"
      );

    expect(
      updated.status
    ).toBe("undo_failed");

    expect(
      updated.undoResult
    ).toEqual({
      actionId,
      success: false,
      conflict: false,
      error: "Resource changed"
    });
  });

  it("gets an action by id", async () => {
    const actionId =
      crypto.randomUUID();

    await journal.create({
      id: actionId,
      input: {
        projectId,
        type: "create",
        target: "test.txt"
      },
      undoStrategy: "restore"
    });

    const entry =
      await journal.get(actionId);

    expect(entry).not.toBeNull();
    expect(entry?.id).toBe(
      actionId
    );
  });

  it("returns null for an unknown action", async () => {
    const entry =
      await journal.get(
        crypto.randomUUID()
      );

    expect(entry).toBeNull();
  });

  it("lists project actions", async () => {
    const testProjectId =
      `list-project-${crypto.randomUUID()}`;

    await journal.create({
      id: crypto.randomUUID(),
      input: {
        projectId: testProjectId,
        type: "create",
        target: "a.txt"
      },
      undoStrategy: "restore"
    });

    await journal.create({
      id: crypto.randomUUID(),
      input: {
        projectId: testProjectId,
        type: "create",
        target: "b.txt"
      },
      undoStrategy: "restore"
    });

    const entries =
      await journal.list(
        testProjectId
      );

    expect(entries).toHaveLength(2);
    expect(
      entries.every(
        (entry) =>
          entry.projectId ===
          testProjectId
      )
    ).toBe(true);
  });
});