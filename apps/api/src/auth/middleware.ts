import { createClerkClient } from "@clerk/backend";
import type {
  Context,
  Next,
} from "hono";

import type {
  MercyEnv,
} from "./context";

const secretKey =
  process.env.CLERK_SECRET_KEY;

const publishableKey =
  process.env.CLERK_PUBLISHABLE_KEY;

if (!secretKey) {
  throw new Error(
    "CLERK_SECRET_KEY is not configured",
  );
}

if (!publishableKey) {
  throw new Error(
    "CLERK_PUBLISHABLE_KEY is not configured",
  );
}

const clerkClient =
  createClerkClient({
    secretKey,
    publishableKey,
  });

export interface AuthUser {
  readonly userId: string;
  readonly sessionId: string;
}

export const authUserKey =
  "authUser" as const;

export async function requireClerkAuth(
  c: Context<MercyEnv>,
  next: Next,
): Promise<Response | void> {
  try {
    const requestState =
      await clerkClient.authenticateRequest(
        c.req.raw,
        {
          authorizedParties: [
            "http://localhost:3000",
          ],
        },
      );

    if (
      !requestState.isAuthenticated
    ) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "Authentication is required",
        },
        401,
      );
    }

    const auth =
      requestState.toAuth();

    if (
      !auth.userId ||
      !auth.sessionId
    ) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "Invalid authentication context",
        },
        401,
      );
    }

    c.set(
      authUserKey,
      {
        userId: auth.userId,
        sessionId: auth.sessionId,
      },
    );

    await next();
  } catch (error) {
    console.error(
      "Clerk authentication failed:",
      error,
    );

    return c.json(
      {
        error: "Unauthorized",
        message:
          "Invalid authentication credentials",
      },
      401,
    );
  }
}