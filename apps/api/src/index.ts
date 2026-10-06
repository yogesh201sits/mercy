import { Hono } from "hono";

import {
  createMercyRuntime,
} from "./runtime";

import {
  createActionRoutes,
} from "./routes/actions";

const app = new Hono();

const services =
  createMercyRuntime();

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

export default app;