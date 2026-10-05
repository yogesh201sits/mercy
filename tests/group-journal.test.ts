import { describe, expect, test } from "bun:test";
import { InMemoryActionGroupJournal } from "../packages/journal/src";

describe("InMemoryActionGroupJournal", () => {
  test("creates an empty pending group", async () => {
    const journal = new InMemoryActionGroupJournal();

    const group = await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    expect(group).toMatchObject({
      id: "group-1",
      projectId: "project-1",
      status: "pending",
      actionIds: []
    });

    expect(group.createdAt).toBeInstanceOf(Date);
  });

  test("adds actions while preserving execution order", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    await journal.addAction("group-1", "action-1");
    await journal.addAction("group-1", "action-2");
    const group = await journal.addAction(
      "group-1",
      "action-3"
    );

    expect(group.actionIds).toEqual([
      "action-1",
      "action-2",
      "action-3"
    ]);
  });

  test("does not add the same action twice", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    await journal.addAction("group-1", "action-1");
    const group = await journal.addAction(
      "group-1",
      "action-1"
    );

    expect(group.actionIds).toEqual(["action-1"]);
  });

  test("updates group lifecycle", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    await journal.markRunning("group-1");

    let group = await journal.get("group-1");
    expect(group?.status).toBe("running");

    await journal.markCompleted("group-1");

    group = await journal.get("group-1");

    expect(group?.status).toBe("completed");
    expect(group?.completedAt).toBeInstanceOf(Date);
  });

  test("records group failure", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    const group = await journal.markFailed(
      "group-1",
      "Action execution failed"
    );

    expect(group.status).toBe("failed");
    expect(group.error).toBe("Action execution failed");
  });

  test("records undo failure", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    const result = {
      groupId: "group-1",
      success: false,
      conflict: true,
      results: [],
      error: "Action changed externally"
    };

    await journal.markUndoing("group-1");

    const group = await journal.markUndoFailed(
      "group-1",
      result
    );

    expect(group.status).toBe("undo_failed");
    expect(group.error).toBe("Action changed externally");
  });

  test("gets group by id", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    const group = await journal.get("group-1");

    expect(group?.id).toBe("group-1");
  });

  test("returns null for unknown group", async () => {
    const journal = new InMemoryActionGroupJournal();

    const group = await journal.get("missing");

    expect(group).toBeNull();
  });

  test("lists groups by project", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    await journal.create({
      id: "group-2",
      projectId: "project-1"
    });

    await journal.create({
      id: "group-3",
      projectId: "project-2"
    });

    const groups = await journal.list("project-1");

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.id)).toEqual([
      "group-1",
      "group-2"
    ]);
  });

  test("throws when adding action to unknown group", async () => {
    const journal = new InMemoryActionGroupJournal();

    expect(
      journal.addAction("missing", "action-1")
    ).rejects.toThrow("Action group not found");
  });

  test("throws when creating duplicate group", async () => {
    const journal = new InMemoryActionGroupJournal();

    await journal.create({
      id: "group-1",
      projectId: "project-1"
    });

    expect(
      journal.create({
        id: "group-1",
        projectId: "project-1"
      })
    ).rejects.toThrow("Action group already exists");
  });
});