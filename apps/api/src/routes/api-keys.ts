import { Hono } from "hono";

import type {
  MercyEnv,
} from "../auth/context";

import {
  requireClerkAuth,
} from "../auth/middleware";

import {
  requireClerkProjectAccess,
} from "../auth/clerk-project-middleware";

import type {
  PostgresApiKeyStore,
  PostgresProjectStore,
} from "@mercy/postgres";

export function createApiKeyRoutes(
  projects: PostgresProjectStore,
  apiKeys: PostgresApiKeyStore,
) {
  const app = new Hono<MercyEnv>();

  /*
  
  * Create API key
  *
  * POST /dashboard/projects/:projectId/api-keys
    */
  app.post(
    "/dashboard/projects/:projectId/api-keys",
    requireClerkAuth,
    requireClerkProjectAccess(projects),
    async (c) => {
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

      const projectId =
        c.req.param("projectId");

      if (!projectId) {
        return c.json(
          {
            error: "Bad Request",
            message: "Project ID is required",
          },
          400,
        );
      }

      try {
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
            projectId:
              created.apiKey.projectId,
            name: created.apiKey.name,
            keyPrefix:
              created.apiKey.keyPrefix,
            createdAt:
              created.apiKey.createdAt,
            secret: created.secret,
          },
          201,
        );
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
  
  * List API keys
  *
  * GET /dashboard/projects/:projectId/api-keys
    */
  app.get(
    "/dashboard/projects/:projectId/api-keys",
    requireClerkAuth,
    requireClerkProjectAccess(projects),
    async (c) => {
      const projectId =
        c.req.param("projectId");

      if (!projectId) {
        return c.json(
          {
            error: "Bad Request",
            message: "Project ID is required",
          },
          400,
        );
      }

      try {
        const keys =
          await apiKeys.listByProject(
            projectId,
          );

        return c.json(keys, 200);
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
  
  * Revoke API key
  *
  * POST /dashboard/projects/:projectId/api-keys/:keyId/revoke
    */
  app.post(
    "/dashboard/projects/:projectId/api-keys/:keyId/revoke",
    requireClerkAuth,
    requireClerkProjectAccess(projects),
    async (c) => {
      const projectId =
        c.req.param("projectId");

      const keyId =
        c.req.param("keyId");

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

      try {
        const keys =
          await apiKeys.listByProject(
            projectId,
          );

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

        return c.json(
          {
            id: revoked.id,
            projectId:
              revoked.projectId,
            name: revoked.name,
            keyPrefix:
              revoked.keyPrefix,
            createdAt:
              revoked.createdAt,
            lastUsedAt:
              revoked.lastUsedAt,
            revokedAt:
              revoked.revokedAt,
          },
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
          500,
        );
      }
    },
  );

  return app;
}
