import type { Context, Next } from "hono";

import {
  apiKeyAuthKey,
  type ApiKeyAuth,
} from "./api-key-middleware";

export async function requireProjectAccess(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const auth =
    c.get(apiKeyAuthKey) as ApiKeyAuth | undefined;

  if (!auth) {
    return c.json(
      {
        error: "Unauthorized",
        message: "API key authentication is required",
      },
      401,
    );
  }

  const projectId =
    c.req.param("projectId");

  if (!projectId) {
    return c.json(
      {
        error: "Bad Request",
        message: "Project ID is required",
      },
      400,
    );
  }

  if (auth.projectId !== projectId) {
    return c.json(
      {
        error: "Forbidden",
        message:
          "API key does not have access to this project",
      },
      403,
    );
  }

  await next();
}