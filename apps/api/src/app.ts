import { Hono } from "hono";

import type {
  PostgresProjectStore,
} from "@mercy/postgres";

import type { MercyRuntime } from "@mercy/runtime";

import {
  createActionRoutes,
} from "./routes/actions";

import {
  createGroupRoutes,
} from "./routes/groups";

import {
  createProjectRoutes,
} from "./routes/projects";

export interface MercyApiDependencies {
  readonly runtime: MercyRuntime;
  readonly projects: PostgresProjectStore;
}

export function createApp(
  dependencies: MercyApiDependencies,
) {
  const app = new Hono();

  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      service: "mercy-api",
    });
  });

  app.route(
    "/",
    createProjectRoutes(
      dependencies.projects,
    ),
  );

  app.route(
    "/",
    createActionRoutes(
      dependencies.runtime,
    ),
  );

  app.route(
    "/",
    createGroupRoutes(
      dependencies.runtime,
    ),
  );

  return app;
}