import { describe, expect, test } from "bun:test";

import type { ActionGroupStatus } from "../packages/core/src";
import { createPrismaClient } from "../packages/postgres/src/client/client";
import { PostgresActionGroupJournal } from "../packages/postgres/src/groups/postgres-action-group-journal";

const prisma = createPrismaClient();
const journal = new PostgresActionGroupJournal(prisma);

async function createAction(
  id: string,
  projectId: string
): Promise<void> {
  await prisma.action.create({
    data: {
      id,
      projectId,
      type: "filesystem",
      target: `/tmp/${id}`,
      status: "completed",
      undoStrategy: "snapshot"
    }
  });
}
async function createActions(count: number,projectId: string) {
  const actions = [];

  for (let index = 0; index < count; index += 1) {
    const action = await prisma.action.create({
      data: {
        id: crypto.randomUUID(),
        projectId,
        type: "custom",
        target: `target-${index}`,
        status: "completed",
        undoStrategy: "restore",
      },
    });

    actions.push(action);
  }

  return actions;
}
describe("PostgresActionGroupJournal", () => {
  const projectId = `test-project-${crypto.randomUUID()}`;

  test("creates and retrieves an action group", async () => {
    const groupId = crypto.randomUUID();

    const created = await journal.create({
      id: groupId,
      projectId
    });

    expect(created.id).toBe(groupId);
    expect(created.projectId).toBe(projectId);
    expect(created.status).toBe("pending");
    expect(created.actionIds).toEqual([]);

    const stored = await journal.get(groupId);

    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(groupId);
    expect(stored?.projectId).toBe(projectId);
    expect(stored?.status).toBe("pending");
    expect(stored?.actionIds).toEqual([]);
  },45_000);

  test("persists actions in insertion order", async () => {
    const groupId = crypto.randomUUID();

    await journal.create({
      id: groupId,
      projectId
    });

    const actionIds = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID()
    ];

    for (const actionId of actionIds) {
      await createAction(actionId, projectId);
      await journal.addAction(groupId, actionId);
    }

    const group = await journal.get(groupId);

    expect(group?.actionIds).toEqual(actionIds);

    const rows =
      await prisma.actionGroupAction.findMany({
        where: {
          groupId
        },
        orderBy: {
          position: "asc"
        }
      });

    expect(
      rows.map((row) => row.actionId)
    ).toEqual(actionIds);

    expect(
      rows.map((row) => row.position)
    ).toEqual([0, 1, 2]);
  },45_000);

  test("does not duplicate an existing action", async () => {
    const groupId = crypto.randomUUID();
    const actionId = crypto.randomUUID();

    await journal.create({
      id: groupId,
      projectId
    });

    await createAction(actionId, projectId);

    await journal.addAction(groupId, actionId);
    await journal.addAction(groupId, actionId);

    const group = await journal.get(groupId);

    expect(group?.actionIds).toEqual([actionId]);

    const count =
      await prisma.actionGroupAction.count({
        where: {
          groupId,
          actionId
        }
      });

    expect(count).toBe(1);
  },45_000);

  test("persists group lifecycle transitions", async () => {
    const groupId = crypto.randomUUID();

    await journal.create({
      id: groupId,
      projectId
    });

    const statuses: ActionGroupStatus[] = [
      "running",
      "completed"
    ];

    let group = await journal.markRunning(
      groupId
    );

    if(statuses[0])
    expect(group.status).toBe(statuses[0]);

    group = await journal.markCompleted(
      groupId
    );

    if(statuses[1])
    expect(group.status).toBe(statuses[1]);
    expect(group.completedAt).toBeInstanceOf(Date);
  },45_000);

  test("persists failed state and error", async () => {
    const groupId = crypto.randomUUID();
    const error = "group execution failed";

    await journal.create({
      id: groupId,
      projectId
    });

    const group = await journal.markFailed(
      groupId,
      error
    );

    expect(group.status).toBe("failed");
    expect(group.error).toBe(error);

    const stored = await journal.get(groupId);

    expect(stored?.status).toBe("failed");
    expect(stored?.error).toBe(error);
  },45_000);

  test("persists undo lifecycle", async () => {
    const groupId = crypto.randomUUID();

    await journal.create({
      id: groupId,
      projectId
    });

    await journal.markRunning(groupId);
    await journal.markCompleted(groupId);

    let group = await journal.markUndoing(
      groupId
    );

    expect(group.status).toBe("undoing");

    group = await journal.markUndone(
      groupId,
      {
        groupId,
        success: true,
        conflict: false,
        results: []
      }
    );

    expect(group.status).toBe("undone");
    expect(group.error).toBeUndefined();
  },45_000);

  test("persists undo failure", async () => {
    const groupId = crypto.randomUUID();

    await journal.create({
      id: groupId,
      projectId
    });

    await journal.markRunning(groupId);
    await journal.markCompleted(groupId);
    await journal.markUndoing(groupId);

    const result = {
      groupId,
      success: false,
      conflict: true,
      results: [],
      error: "undo conflict"
    };

    const group =
      await journal.markUndoFailed(
        groupId,
        result
      );

    expect(group.status).toBe("undo_failed");
    expect(group.error).toBe("undo conflict");
  },45_000);

  test("returns null for a missing group", async () => {
    const group = await journal.get(
      crypto.randomUUID()
    );

    expect(group).toBeNull();
  },45_000);

  test("lists groups by project", async () => {
    const first = await journal.create({
      id: crypto.randomUUID(),
      projectId
    });

    const second = await journal.create({
      id: crypto.randomUUID(),
      projectId
    });

    const groups =
      await journal.list(projectId);

    const ids = groups.map(
      (group) => group.id
    );

    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
  },45_000);

  test("throws when operating on a missing group", async () => {
    await expect(
      journal.markRunning(
        crypto.randomUUID()
      )
    ).rejects.toMatchObject({
      code: "ACTION_NOT_FOUND"
    });
  },45_000);
  test("preserves action ordering for multiple actions", async () => {
  const group = await journal.create({
    id: crypto.randomUUID(),
    projectId,
  });

  const actions = await createActions(3,projectId);
  await journal.addAction(group.id, actions[0]!.id);
  await journal.addAction(group.id, actions[1]!.id);
  await journal.addAction(group.id, actions[2]!.id);

  const stored = await journal.get(group.id);

  expect(stored?.actionIds).toEqual([
    actions[0]!.id,
    actions[1]!.id,
    actions[2]!.id,
  ]);
});
});