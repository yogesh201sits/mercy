import { Hono } from "hono";
import { z } from "zod";

import type { MercyRuntime } from "@mercy/runtime";

const createGroupSchema = z.object({});

export function createGroupRoutes(
  runtime: MercyRuntime,
) {
  const app = new Hono();

  app.post(
    "/projects/:projectId/groups",
    async (c) => {
      const projectId =
        c.req.param("projectId");

      const body =
        await c.req.json().catch(() => ({}));

      const parsed =
        createGroupSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          {
            error: "Invalid group input",
            details: parsed.error.flatten(),
          },
          400,
        );
      }

      try {
        const group =
          await runtime.startGroup({
            projectId,
          });

        return c.json(group, 201);
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
    "/projects/:projectId/groups",
    async (c) => {
      const projectId =
        c.req.param("projectId");

      try {
        const groups =
          await runtime.listGroups(
            projectId,
          );

        return c.json(groups, 200);
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
    "/groups/:groupId",
    async (c) => {
      const groupId =
        c.req.param("groupId");

      try {
        const group =
          await runtime.getGroup(
            groupId,
          );

        return c.json(group, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          404,
        );
      }
    },
  );

  app.post(
    "/groups/:groupId/complete",
    async (c) => {
      const groupId =
        c.req.param("groupId");

      try {
        const group =
          await runtime.completeGroup(
            groupId,
          );

        return c.json(group, 200);
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          400,
        );
      }
    },
  );

  app.post(
    "/groups/:groupId/undo",
    async (c) => {
      const groupId =
        c.req.param("groupId");

      try {
        const result =
          await runtime.undoGroup(
            groupId,
          );

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
          400,
        );
      }
    },
  );

  return app;
}