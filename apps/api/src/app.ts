import { Hono } from "hono";
import { cors } from "hono/cors";

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
  createDashboardRoutes,
} from "./routes/dashboard";

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
  const app =
    new Hono<MercyEnv>();

  /*
   * CORS
   */
  app.use(
    "*",
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      allowMethods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],
      allowHeaders: [
        "Content-Type",
        "Authorization",
      ],
      credentials: true,
    }),
  );

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
   * Human / dashboard routes
   */
  app.route(
    "/",
    createProjectRoutes(
      dependencies.projects,
    ),
  );

  app.route(
    "/",
    createDashboardRoutes(
      dependencies.runtime,
      dependencies.projects,
    ),
  );

  /*
   * Agent API routes
   */
  app.route(
    "/",
    createApiKeyRoutes(
      dependencies.projects,
      dependencies.apiKeys,
    ),
  );

  app.route(
    "/",
    createActionRoutes(
      dependencies.runtime,
      dependencies.apiKeys,
    ),
  );

  app.route(
    "/",
    createGroupRoutes(
      dependencies.runtime,
      dependencies.apiKeys,
    ),
  );

  return app;
}