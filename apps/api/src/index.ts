import { serve } from "bun";

import { createApp } from "./app";

const app = createApp();

serve({
  fetch: app.fetch,
  port: Number(
    process.env["PORT"] ?? 3000,
  ),
});

console.log(
  `Mercy API running on http://localhost:${process.env["PORT"] ?? 3000}`,
);