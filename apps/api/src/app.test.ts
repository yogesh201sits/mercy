import {
  describe,
  expect,
  test,
} from "bun:test";

import type {
  MercyRuntime,
} from "@mercy/runtime";

import {
  createApp,
} from "./app";

describe("Mercy API", () => {
  test("GET /health", async () => {
    const runtime =
      {} as MercyRuntime;

    const app =
      createApp({
        runtime,
      });

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