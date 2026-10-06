import { Hono } from "hono";

import type { MercyRuntime } from "@mercy/runtime";

import {
  createMercyRuntime,
} from "./runtime";

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
  dependencies?: MercyApiDependencies,
) {
  const app = new Hono();

  const services =
    dependencies ??
    {
      runtime:
        createMercyRuntime().runtime,
    };

  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      service: "mercy-api",
    });
  });

  app.route(
    "/",
    createActionRoutes(
      services.runtime,
    ),
  );

  app.route(
    "/",
    createGroupRoutes(
      services.runtime,
    ),
  );

  return app;
}