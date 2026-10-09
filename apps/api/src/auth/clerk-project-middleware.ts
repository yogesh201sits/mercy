import type { Context, Next } from "hono";

import type { PostgresProjectStore } from "@mercy/postgres";

import {
  authUserKey,
} from "./middleware";

import type {
  MercyEnv,
} from "./context";

export function requireClerkProjectAccess(
  projects: PostgresProjectStore,
) {
  return async (
    c: Context<MercyEnv>,
    next: Next,
  ): Promise<Response | void> => {
    const user =
      c.get(authUserKey);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "Clerk authentication is required",
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
          message:
            "Project ID is required",
        },
        400,
      );
    }

    const project =
      await projects.get(projectId);

    if (!project) {
      return c.json(
        {
          error: "Not Found",
          message: "Project not found",
        },
        404,
      );
    }

    if (
      project.clerkUserId !==
      user.userId
    ) {
      return c.json(
        {
          error: "Forbidden",
          message:
            "You do not have access to this project",
        },
        403,
      );
    }

    await next();
  };
}