import { Hono } from "hono";
import { z } from "zod";

import type {
  PostgresApiKeyStore,
} from "@mercy/postgres";

import type {
  MercyRuntime,
} from "@mercy/runtime";

import type {
  MercyEnv,
} from "../auth/context";

import {
  apiKeyAuthKey,
  requireApiKey,
  requireProjectAccess,
} from "../auth";

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
  apiKeys: PostgresApiKeyStore,
) {
  const app = new Hono<MercyEnv>();

  /*
   * Create action
   *
   * POST /projects/:projectId/actions
   *
   * API-key authenticated.
   */
  app.post(
    "/projects/:projectId/actions",
    requireApiKey(apiKeys),
    requireProjectAccess,
    async (c) => {
      const projectId =
        c.req.param("projectId");

      let body: unknown;

      try {
        body = await c.req.json();
      } catch {
        return c.json(
          {
            error: "Bad Request",
            message: "Invalid JSON body",
          },
          400,
        );
      }

      const parsed =
        createActionSchema.safeParse(body);

      if (!projectId) {
        return c.json(
          {
            error: "Project id required",
          },
          400,
        );
      }

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

  /*
   * List project actions
   *
   * GET /projects/:projectId/actions
   *
   * API-key authenticated.
   */
  app.get(
    "/projects/:projectId/actions",
    requireApiKey(apiKeys),
    requireProjectAccess,
    async (c) => {
      const projectId =
        c.req.param("projectId");
      if (!projectId) {
        return c.json(
          {
            error: "Projct id required",
          },
          400,
        );
      }

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

  /*
   * Get action
   *
   * GET /actions/:actionId
   *
   * API-key authenticated.
   */
  app.get(
    "/actions/:actionId",
    requireApiKey(apiKeys),
    async (c) => {
      const actionId =
        c.req.param("actionId");
      if (!actionId) {
        return c.json(
          {
            error: "Action id required",
          },
          400,
        );
      }

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

        const auth =
          c.get(apiKeyAuthKey);

        if (
          action.projectId !==
          auth.projectId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "API key does not have access to this action",
            },
            403,
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

  /*
   * Undo action
   *
   * POST /actions/:actionId/undo
   *
   * API-key authenticated.
   */
  app.post(
    "/actions/:actionId/undo",
    requireApiKey(apiKeys),
    async (c) => {
      const actionId =
        c.req.param("actionId");
      if (!actionId) {
        return c.json(
          {
            error: "Action id required",
          },
          400,
        );
      }

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

        const auth =
          c.get(apiKeyAuthKey);

        if (
          action.projectId !==
          auth.projectId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "API key does not have access to this action",
            },
            403,
          );
        }

        const result =
          await runtime.undo(actionId);

        if (!result.success) {
          return c.json(
            result,
            result.conflict
              ? 409
              : 422,
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