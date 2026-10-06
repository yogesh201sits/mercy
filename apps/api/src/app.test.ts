import {
  describe,
  expect,
  test,
} from "bun:test";

import { createApp } from "./app";

describe("Mercy API", () => {
  test("GET /health", async () => {
    const app = createApp();

    const response =
      await app.request(
        "http://localhost/health",
      );

    expect(response.status).toBe(200);

    expect(
      await response.json(),
    ).toEqual({
      status: "ok",
      service: "mercy-api",
    });
  });
});