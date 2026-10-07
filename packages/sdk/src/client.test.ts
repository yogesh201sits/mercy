import { describe, expect, mock, test } from "bun:test";

import type {
  ActionGroupInput,
  ActionInput,
} from "@mercy/core";

import {
  LocalRuntimeTransport,
  MercyClient,
} from "./index";

describe("@mercy/sdk", () => {
  test("MercyClient delegates execute to transport", async () => {
    const execute = mock(async () => ({
      actionId: "action-1",
      success: true,
    }));

    const transport = {
      execute,
      undo: mock(async () => ({
        actionId: "action-1",
        success: true,
        conflict: false,
      })),
      getAction: mock(async () => null),
      listActions: mock(async () => []),
      startGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "pending" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      completeGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "completed" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      undoGroup: mock(async () => ({
        groupId: "group-1",
        success: true,
        conflict: false,
        results: [],
      })),
      getGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "pending" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      listGroups: mock(async () => []),
    };

    const client = new MercyClient({
      transport,
    });

    const input: ActionInput = {
      projectId: "project-1",
      type: "custom",
      target: "test-tool",
    };

    const result = await client.execute(input);

    expect(result.success).toBe(true);
    expect(result.actionId).toBe("action-1");
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(input, undefined);
  });

  test("MercyClient delegates undo", async () => {
    const undo = mock(async () => ({
      actionId: "action-1",
      success: true,
      conflict: false,
    }));

    const transport = {
      execute: mock(async () => ({
        actionId: "action-1",
        success: true,
      })),
      undo,
      getAction: mock(async () => null),
      listActions: mock(async () => []),
      startGroup: mock(async () => {
        throw new Error("not used");
      }),
      completeGroup: mock(async () => {
        throw new Error("not used");
      }),
      undoGroup: mock(async () => {
        throw new Error("not used");
      }),
      getGroup: mock(async () => {
        throw new Error("not used");
      }),
      listGroups: mock(async () => []),
    };

    const client = new MercyClient({
      transport,
    });

    const result = await client.undo("action-1");

    expect(result.success).toBe(true);
    expect(result.conflict).toBe(false);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(undo).toHaveBeenCalledWith("action-1");
  });

  test("MercyClient delegates group operations", async () => {
    const startGroup = mock(async (input: ActionGroupInput) => ({
      id: "group-1",
      projectId: input.projectId,
      status: "pending" as const,
      actionIds: [],
      createdAt: new Date(),
    }));

    const transport = {
      execute: mock(async () => ({
        actionId: "action-1",
        success: true,
      })),
      undo: mock(async () => ({
        actionId: "action-1",
        success: true,
        conflict: false,
      })),
      getAction: mock(async () => null),
      listActions: mock(async () => []),
      startGroup,
      completeGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "completed" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      undoGroup: mock(async () => ({
        groupId: "group-1",
        success: true,
        conflict: false,
        results: [],
      })),
      getGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "pending" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      listGroups: mock(async () => []),
    };

    const client = new MercyClient({
      transport,
    });

    const input: ActionGroupInput = {
      projectId: "project-1",
    };

    const group = await client.startGroup(input);

    expect(group.id).toBe("group-1");
    expect(startGroup).toHaveBeenCalledTimes(1);
    expect(startGroup).toHaveBeenCalledWith(input);
  });

  test("LocalRuntimeTransport delegates to runtime", async () => {
    const runtime = {
      execute: mock(async () => ({
        actionId: "action-1",
        success: true,
      })),
      undo: mock(async () => ({
        actionId: "action-1",
        success: true,
        conflict: false,
      })),
      getAction: mock(async () => null),
      listActions: mock(async () => []),
      startGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "pending" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      completeGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "completed" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      undoGroup: mock(async () => ({
        groupId: "group-1",
        success: true,
        conflict: false,
        results: [],
      })),
      getGroup: mock(async () => ({
        id: "group-1",
        projectId: "project-1",
        status: "pending" as const,
        actionIds: [],
        createdAt: new Date(),
      })),
      listGroups: mock(async () => []),
    };

    const transport = new LocalRuntimeTransport(runtime);

    const input: ActionInput = {
      projectId: "project-1",
      type: "custom",
      target: "test-tool",
    };

    const result = await transport.execute(input);

    expect(result.success).toBe(true);
    expect(runtime.execute).toHaveBeenCalledTimes(1);
    expect(runtime.execute).toHaveBeenCalledWith(
      input,
      undefined,
    );
  });
});