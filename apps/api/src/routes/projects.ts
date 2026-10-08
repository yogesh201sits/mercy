import { Hono } from "hono";

import type {
  PostgresProjectStore,
} from "@mercy/postgres";

import {
  requireClerkAuth,
  authUserKey,
  type AuthUser,
} from "../auth/middleware";

type Variables = {
  authUser: AuthUser;
};

export function createProjectRoutes(
  projects: PostgresProjectStore,
) {
  const app = new Hono<{ Variables: Variables }>();

  /*
   * Create project
   *
   * POST /projects
   */
  app.post(
    "/projects",
    requireClerkAuth,
    async (c) => {
      const user = c.get(authUserKey);

      let body: {
        name?: unknown;
      };

      try {
        body = await c.req.json();
      } catch {
        return c.json(
          {
            error: "Bad Request",
            message: "Invalid JSON body",
          },
          400,
        );
      }

      if (
        typeof body.name !== "string" ||
        body.name.trim().length === 0
      ) {
        return c.json(
          {
            error: "Bad Request",
            message: "Project name is required",
          },
          400,
        );
      }

      const name = body.name.trim();

      if (name.length > 100) {
        return c.json(
          {
            error: "Bad Request",
            message: "Project name must be 100 characters or fewer",
          },
          400,
        );
      }

      const project = await projects.create({
        name,
        clerkUserId: user.userId,
      });

      return c.json(project, 201);
    },
  );

  /*
   * List projects belonging to authenticated Clerk user
   *
   * GET /projects
   */
  app.get(
    "/projects",
    requireClerkAuth,
    async (c) => {
      const user = c.get(authUserKey);

      const userProjects =
        await projects.listByClerkUser(user.userId);

      return c.json(userProjects);
    },
  );

  /*
   * Get a project belonging to authenticated Clerk user
   *
   * GET /projects/:projectId
   */
  app.get(
    "/projects/:projectId",
    requireClerkAuth,
    async (c) => {
      const user = c.get(authUserKey);
      const projectId = c.req.param("projectId");
      const project = await projects.get(projectId!);

      if (!project) {
        return c.json(
          {
            error: "Not Found",
            message: "Project not found",
          },
          404,
        );
      }

      if (project.clerkUserId !== user.userId) {
        return c.json(
          {
            error: "Forbidden",
            message: "You do not have access to this project",
          },
          403,
        );
      }

      return c.json(project);
    },
  );

  return app;
}