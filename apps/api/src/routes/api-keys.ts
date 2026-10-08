import { Hono } from "hono";

import type {
  PostgresApiKeyStore,
  PostgresProjectStore,
} from "@mercy/postgres";

import {
  authUserKey,
  requireClerkAuth,
  type AuthUser,
} from "../auth/middleware";

function getUserId(
  c: Parameters<typeof requireClerkAuth>[0],
): string {
  const user = c.get(authUserKey) as AuthUser | undefined;

  if (!user) {
    throw new Error("Authentication context is missing");
  }

  return user.userId;
}

export function createApiKeyRoutes(
  projects: PostgresProjectStore,
  apiKeys: PostgresApiKeyStore,
) {
  const app = new Hono();

  /*
   * Create API key
   *
   * POST /projects/:projectId/api-keys
   */
  app.post(
    "/projects/:projectId/api-keys",
    requireClerkAuth,
    async (c) => {
      const userId = getUserId(c);
      const projectId = c.req.param("projectId");
      if (!projectId) {
        return c.json(
            {
            error: "Bad Request",
            message: "Project ID is required",
            },
            400,
        );
      }

      const project =
        await projects.get(projectId);

      if (!project) {
        return c.json(
          {
            error: "Not Found",
            message: "Project not found",
          },
          404,
        );
      }

      if (project.clerkUserId !== userId) {
        return c.json(
          {
            error: "Forbidden",
            message: "You do not have access to this project",
          },
          403,
        );
      }

      let body: {
        name?: unknown;
      };

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

      if (
        typeof body.name !== "string" ||
        body.name.trim().length === 0
      ) {
        return c.json(
          {
            error: "Bad Request",
            message: "API key name is required",
          },
          400,
        );
      }

      const name = body.name.trim();

      if (name.length > 100) {
        return c.json(
          {
            error: "Bad Request",
            message:
              "API key name must be 100 characters or fewer",
          },
          400,
        );
      }

      const created =
        await apiKeys.create({
          projectId,
          name,
        });

      /*
       * The secret is returned exactly once.
       * Only the hash is persisted.
       */
      return c.json(
        {
          id: created.apiKey.id,
          projectId: created.apiKey.projectId,
          name: created.apiKey.name,
          keyPrefix: created.apiKey.keyPrefix,
          createdAt: created.apiKey.createdAt,
          secret: created.secret,
        },
        201,
      );
    },
  );

  /*
   * List API keys
   *
   * GET /projects/:projectId/api-keys
   */
  app.get(
    "/projects/:projectId/api-keys",
    requireClerkAuth,
    async (c) => {
      const userId = getUserId(c);
      const projectId = c.req.param("projectId");
            if (!projectId) {
        return c.json(
            {
            error: "Bad Request",
            message: "Project ID is required",
            },
            400,
        );
      }

      const project =
        await projects.get(projectId);

      if (!project) {
        return c.json(
          {
            error: "Not Found",
            message: "Project not found",
          },
          404,
        );
      }

      if (project.clerkUserId !== userId) {
        return c.json(
          {
            error: "Forbidden",
            message: "You do not have access to this project",
          },
          403,
        );
      }

      const keys =
        await apiKeys.listByProject(projectId!);

      return c.json(keys);
    },
  );

  /*
   * Revoke API key
   *
   * POST /projects/:projectId/api-keys/:keyId/revoke
   */
  app.post(
    "/projects/:projectId/api-keys/:keyId/revoke",
    requireClerkAuth,
    async (c) => {
      const userId = getUserId(c);
      const projectId = c.req.param("projectId");
      const keyId = c.req.param("keyId");

      if (!projectId) {
        return c.json(
            {
            error: "Bad Request",
            message: "Project ID is required",
            },
            400,
        );
      }
      if (!keyId) {
        return c.json(
            {
            error: "Bad Request",
            message: "Key ID is required",
            },
            400,
        );
      }

      const project =
        await projects.get(projectId);

      if (!project) {
        return c.json(
          {
            error: "Not Found",
            message: "Project not found",
          },
          404,
        );
      }

      if (project.clerkUserId !== userId) {
        return c.json(
          {
            error: "Forbidden",
            message: "You do not have access to this project",
          },
          403,
        );
      }

      const keys =
        await apiKeys.listByProject(projectId);

      const keyBelongsToProject =
        keys.some(
          (key) => key.id === keyId,
        );

      if (!keyBelongsToProject) {
        return c.json(
          {
            error: "Not Found",
            message: "API key not found",
          },
          404,
        );
      }

      const revoked =
        await apiKeys.revoke(keyId);

      return c.json({
        id: revoked.id,
        projectId: revoked.projectId,
        name: revoked.name,
        keyPrefix: revoked.keyPrefix,
        createdAt: revoked.createdAt,
        lastUsedAt: revoked.lastUsedAt,
        revokedAt: revoked.revokedAt,
      });
    },
  );

  return app;
}