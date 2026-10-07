import { Hono } from "hono";
import { z } from "zod";

import type { MercyRuntime } from "@mercy/runtime";

const actionTypeSchema = z.enum([
  "create",
  "update",
  "delete",
  "rename",
  "move",
  "custom",
]);

const createActionSchema = z.object({
  type: actionTypeSchema,
  target: z.string().min(1),
  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
  groupId: z.string().optional(),
});

export function createActionRoutes(
  runtime: MercyRuntime,
) {
  const app = new Hono();

  app.post(
    "/projects/:projectId/actions",
    async (c) => {
      const projectId =
        c.req.param("projectId");

      const body =
        await c.req.json();

      const parsed =
        createActionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          {
            error: "Invalid action input",
            details: parsed.error.flatten(),
          },
          400,
        );
      }

      try {
        const result =
          await runtime.execute(
            {
              projectId,
              type: parsed.data.type,
              target: parsed.data.target,
              ...(parsed.data.metadata
                ? {
                    metadata:
                      parsed.data.metadata,
                  }
                : {}),
            },
            parsed.data.groupId,
          );

        return c.json(result, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  app.get(
    "/projects/:projectId/actions",
    async (c) => {
      const projectId =
        c.req.param("projectId");

      try {
        const actions =
          await runtime.listActions(
            projectId,
          );

        return c.json(actions, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  app.get(
    "/actions/:actionId",
    async (c) => {
      const actionId =
        c.req.param("actionId");

      try {
        const action =
          await runtime.getAction(
            actionId,
          );

        if (!action) {
          return c.json(
            {
              error: "Action not found",
            },
            404,
          );
        }

        return c.json(action, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  app.post(
    "/actions/:actionId/undo",
    async (c) => {
      const actionId =
        c.req.param("actionId");

      try {
        const result =
          await runtime.undo(actionId);

        if (!result.success) {
          return c.json(
            result,
            result.conflict ? 409 : 422,
          );
        }

        return c.json(result, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  return app;
}