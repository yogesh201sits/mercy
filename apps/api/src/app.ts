import { Hono } from "hono";

import type { MercyRuntime } from "@mercy/runtime";

import {
  createActionRoutes,
} from "./routes/actions";

import {
  createGroupRoutes,
} from "./routes/groups";

export interface MercyApiDependencies {
  readonly runtime: MercyRuntime;
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