import { Hono } from "hono";
import { z } from "zod";

import type {
  PostgresApiKeyStore,
} from "@mercy/postgres";

import type { MercyRuntime } from "@mercy/runtime";

import type {
  MercyEnv,
} from "../auth/context";

import {
  apiKeyAuthKey,
  requireApiKey,
} from "../auth/api-key-middleware";

import {
  requireProjectAccess,
} from "../auth/project-middleware";

const createGroupSchema = z.object({});

export function createGroupRoutes(
  runtime: MercyRuntime,
  apiKeys: PostgresApiKeyStore,
) {
  const app = new Hono<MercyEnv>();

  /*
   * Create group
   *
   * POST /projects/:projectId/groups
   */
  app.post(
    "/projects/:projectId/groups",
    requireApiKey(apiKeys),
    requireProjectAccess,
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
      if (!projectId) {
        return c.json(
          {
            error: "Invalid group input",
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

  /*
   * List groups
   *
   * GET /projects/:projectId/groups
   */
  app.get(
    "/projects/:projectId/groups",
    requireApiKey(apiKeys),
    requireProjectAccess,
    async (c) => {
      const projectId =
        c.req.param("projectId");
      if (!projectId) {
        return c.json(
          {
            error: "Invalid group input",
          },
          400,
        );
      }

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

  /*
   * Get group
   *
   * GET /groups/:groupId
   */
  app.get(
    "/groups/:groupId",
    requireApiKey(apiKeys),
    async (c) => {
      const groupId =
        c.req.param("groupId");
      if (!groupId) {
        return c.json(
          {
            error: "Group id required",
          },
          400,
        );
      }

      const auth =
        c.get(apiKeyAuthKey);

      try {
        const group =
          await runtime.getGroup(
            groupId,
          );

        if (
          group.projectId !==
          auth.projectId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "API key does not have access to this group",
            },
            403,
          );
        }

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

  /*
   * Complete group
   *
   * POST /groups/:groupId/complete
   */
  app.post(
    "/groups/:groupId/complete",
    requireApiKey(apiKeys),
    async (c) => {
      const groupId =
        c.req.param("groupId");
      
      if (!groupId) {
        return c.json(
          {
            error: "Group id required",
          },
          400,
        );
      }

      const auth =
        c.get(apiKeyAuthKey);

      try {
        const group =
          await runtime.getGroup(
            groupId,
          );

        if (
          group.projectId !==
          auth.projectId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "API key does not have access to this group",
            },
            403,
          );
        }

        const completedGroup =
          await runtime.completeGroup(
            groupId,
          );

        return c.json(
          completedGroup,
          200,
        );
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

  /*
   * Undo group
   *
   * POST /groups/:groupId/undo
   */
  app.post(
    "/groups/:groupId/undo",
    requireApiKey(apiKeys),
    async (c) => {
      const groupId =
        c.req.param("groupId");

      const auth =
        c.get(apiKeyAuthKey);

      if (!groupId) {
        return c.json(
          {
            error: "Group id required",
          },
          400,
        );
      }

      try {
        const group =
          await runtime.getGroup(
            groupId,
          );

        if (
          group.projectId !==
          auth.projectId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "API key does not have access to this group",
            },
            403,
          );
        }

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