import {
  describe,
  expect,
  test,
} from "bun:test";

import {
  HttpTransport,
} from "./index";

const baseUrl =
  process.env.MERCY_API_URL ??
  "http://localhost:3000";

describe("@mercy/sdk HTTP integration", () => {
  test("health endpoint is reachable", async () => {
    const response = await fetch(
      `${baseUrl}/health`,
    );

    expect(response.ok).toBe(true);

    const body = await response.json();

    expect(body).toEqual({
      status: "ok",
      service: "mercy-api",
    });
  });

  test("executes and reads an action through HTTP transport", async () => {
    const transport = new HttpTransport({
      baseUrl,
    });

    const projectId = `sdk-test-${crypto.randomUUID()}`;
    const target = `sdk-test-${crypto.randomUUID()}.txt`;
    let actionId: string | undefined;

    try {
      const result = await transport.execute({
        projectId,
        type: "create",
        target,
        metadata: {
          content: "SDK HTTP integration test",
        },
      });

      actionId = result.actionId;

      expect(result.success).toBe(true);
      expect(result.actionId).toBeString();

      const action = await transport.getAction(
        result.actionId,
      );

      expect(action).not.toBeNull();
      expect(action?.id).toBe(result.actionId);
      expect(action?.projectId).toBe(projectId);
      expect(action?.target).toBe(target);
    } finally {
      if (actionId) {
        await transport.undo(actionId);
      }
    }
  });

  test("lists actions through HTTP transport", async () => {
    const transport = new HttpTransport({
      baseUrl,
    });

    const projectId = `sdk-list-${crypto.randomUUID()}`;
    const target = `sdk-list-${crypto.randomUUID()}.txt`;
    let actionId: string | undefined;

    try {
      const result = await transport.execute({
        projectId,
        type: "create",
        target,
        metadata: {
          content: "SDK HTTP integration test",
        },
      });

      actionId = result.actionId;

      expect(result.success).toBe(true);

      const actions = await transport.listActions(
        projectId,
      );

      expect(actions.length).toBe(1);
      expect(actions[0]?.id).toBe(result.actionId);
    } finally {
      if (actionId) {
        await transport.undo(actionId);
      }
    }
  });
});