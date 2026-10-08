import { serve } from "bun";

import {
  createApp,
} from "./app";

import {
  createMercyRuntime,
} from "./runtime";

const services =
  createMercyRuntime();

const app =
  createApp({
    runtime: services.runtime,
    projects: services.projects,
    apiKeys: services.apiKeys,
  });

const port = Number(
  process.env["PORT"] ?? 3000,
);

serve({
  fetch: app.fetch,
  port,
});

console.log(
  `Mercy API running on http://localhost:${port}`,
);