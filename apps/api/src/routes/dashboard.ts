import { Hono } from "hono";

import type {
  PostgresProjectStore,
} from "@mercy/postgres";

import type {
  MercyRuntime,
} from "@mercy/runtime";

import type {
  MercyEnv,
} from "../auth/context";

import {
  requireClerkAuth,
} from "../auth/middleware";

import {
  requireClerkProjectAccess,
} from "../auth/clerk-project-middleware";

export function createDashboardRoutes(
  runtime: MercyRuntime,
  projects: PostgresProjectStore,
) {
  const app =
    new Hono<MercyEnv>();

  /*
   * List actions for dashboard
   *
   * GET /dashboard/projects/:projectId/actions
   */
  app.get(
    "/dashboard/projects/:projectId/actions",
    requireClerkAuth,
    requireClerkProjectAccess(projects),
    async (c) => {
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

      try {
        const actions =
          await runtime.listActions(
            projectId,
          );

        return c.json(
          actions,
          200,
        );
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  /*
   * Get action for dashboard
   *
   * GET /dashboard/actions/:actionId
   */
  app.get(
    "/dashboard/actions/:actionId",
    requireClerkAuth,
    async (c) => {
      const actionId =
        c.req.param("actionId");

      if (!actionId) {
        return c.json(
          {
            error: "Bad Request",
            message:
              "Action ID is required",
          },
          400,
        );
      }

      try {
        const action =
          await runtime.getAction(
            actionId,
          );

        if (!action) {
          return c.json(
            {
              error: "Not Found",
              message:
                "Action not found",
            },
            404,
          );
        }

        const project =
          await projects.get(
            action.projectId,
          );

        if (!project) {
          return c.json(
            {
              error: "Not Found",
              message:
                "Project not found",
            },
            404,
          );
        }

        const user =
          c.get("authUser");

        if (
          project.clerkUserId !==
          user.userId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "You do not have access to this action",
            },
            403,
          );
        }

        return c.json(
          action,
          200,
        );
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  /*
   * Undo action from dashboard
   *
   * POST /dashboard/actions/:actionId/undo
   */
  app.post(
    "/dashboard/actions/:actionId/undo",
    requireClerkAuth,
    async (c) => {
      const actionId =
        c.req.param("actionId");

      if (!actionId) {
        return c.json(
          {
            error: "Bad Request",
            message:
              "Action ID is required",
          },
          400,
        );
      }

      try {
        const action =
          await runtime.getAction(
            actionId,
          );

        if (!action) {
          return c.json(
            {
              error: "Not Found",
              message:
                "Action not found",
            },
            404,
          );
        }

        const project =
          await projects.get(
            action.projectId,
          );

        if (!project) {
          return c.json(
            {
              error: "Not Found",
              message:
                "Project not found",
            },
            404,
          );
        }

        const user =
          c.get("authUser");

        if (
          project.clerkUserId !==
          user.userId
        ) {
          return c.json(
            {
              error: "Forbidden",
              message:
                "You do not have access to this action",
            },
            403,
          );
        }

        const result =
          await runtime.undo(
            actionId,
          );

        if (!result.success) {
          return c.json(
            result,
            result.conflict
              ? 409
              : 422,
          );
        }

        return c.json(
          result,
          200,
        );
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          500,
        );
      }
    },
  );

  return app;
}