import { Hono } from "hono";

import type {
  PostgresApiKeyStore,
  PostgresProjectStore,
} from "@mercy/postgres";

import type {
  MercyRuntime,
} from "@mercy/runtime";

import type {
  MercyEnv,
} from "./auth/context";

import {
  createActionRoutes,
} from "./routes/actions";

import {
  createApiKeyRoutes,
} from "./routes/api-keys";

import {
  createGroupRoutes,
} from "./routes/groups";

import {
  createProjectRoutes,
} from "./routes/projects";

export interface MercyApiDependencies {
  readonly runtime: MercyRuntime;
  readonly projects: PostgresProjectStore;
  readonly apiKeys: PostgresApiKeyStore;
}

export function createApp(
  dependencies: MercyApiDependencies,
) {
  const app = new Hono<MercyEnv>();

  /*
   * Health check
   *
   * GET /health
   *
   * Public endpoint.
   */
  app.get(
    "/health",
    (c) => {
      return c.json({
        status: "ok",
        service: "mercy-api",
      });
    },
  );

  /*
   * Project routes
   *
   * Clerk authenticated.
   */
  app.route(
    "/",
    createProjectRoutes(
      dependencies.projects,
    ),
  );

  /*
   * API key management routes
   *
   * Clerk authenticated.
   */
  app.route(
    "/",
    createApiKeyRoutes(
      dependencies.projects,
      dependencies.apiKeys,
    ),
  );

  /*
   * Action routes
   *
   * API-key authenticated.
   */
  app.route(
    "/",
    createActionRoutes(
      dependencies.runtime,
      dependencies.apiKeys,
    ),
  );

  /*
   * Group routes
   *
   * API-key authenticated.
   */
  app.route(
    "/",
    createGroupRoutes(
      dependencies.runtime,
      dependencies.apiKeys,
    ),
  );

  return app;
}