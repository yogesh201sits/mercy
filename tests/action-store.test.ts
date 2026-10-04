import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test
} from "bun:test";

import {
  createPrismaClient
} from "../packages/postgres/src/client/client";

import {
  PostgresActionStore
} from "../packages/postgres/src/repositories/action-store";

const prisma = createPrismaClient();

const store =
  new PostgresActionStore(prisma);

const projectId =
  `test-project-${crypto.randomUUID()}`;

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.action.deleteMany({
    where: {
      projectId
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PostgresActionStore", () => {
  test("creates and retrieves an action", async () => {
    const actionId =
      crypto.randomUUID();

    const created =
      await store.create({
        id: actionId,

        input: {
          projectId,
          type: "create",
          target: "test.txt",

          metadata: {
            source: "test"
          }
        },

        undoStrategy: "restore"
      });

    expect(created.id).toBe(actionId);
    expect(created.projectId)
      .toBe(projectId);
    expect(created.type)
      .toBe("create");
    expect(created.status)
      .toBe("pending");

    const found =
      await store.get(actionId);

    expect(found).not.toBeNull();
    expect(found?.id)
      .toBe(actionId);
    expect(found?.metadata)
      .toEqual({
        source: "test"
      });
  });

  test("updates action status", async () => {
    const actionId =
      crypto.randomUUID();

    await store.create({
      id: actionId,

      input: {
        projectId,
        type: "update",
        target: "test.txt"
      },

      undoStrategy: "restore"
    });

    const startedAt =
      new Date();

    const updated =
      await store.update(
        actionId,
        {
          status: "running",
          startedAt
        }
      );

    expect(updated.status)
      .toBe("running");

    expect(updated.startedAt)
      .toEqual(startedAt);
  });

  test("lists actions by project", async () => {
    await store.create({
      id: crypto.randomUUID(),

      input: {
        projectId,
        type: "create",
        target: "a.txt"
      },

      undoStrategy: "restore"
    });

    await store.create({
      id: crypto.randomUUID(),

      input: {
        projectId,
        type: "delete",
        target: "b.txt"
      },

      undoStrategy: "restore"
    });

    const actions =
      await store.list(projectId);

    expect(actions).toHaveLength(2);
  });

  test("returns null for missing action", async () => {
    const result =
      await store.get(
        crypto.randomUUID()
      );

    expect(result).toBeNull();
  });
});