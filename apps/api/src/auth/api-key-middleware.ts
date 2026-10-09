import type {
  Context,
  Next,
} from "hono";

import {
  PostgresApiKeyStore,
} from "@mercy/postgres";

import type {
  MercyEnv,
} from "./context";

export interface ApiKeyAuth {
  readonly apiKeyId: string;
  readonly projectId: string;
}

export const apiKeyAuthKey =
  "apiKeyAuth" as const;

export function requireApiKey(
  apiKeys: PostgresApiKeyStore,
) {
  return async (
    c: Context<MercyEnv>,
    next: Next,
  ): Promise<Response | void> => {
    const authorization =
      c.req.header("Authorization");

    if (!authorization) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "Authorization header is required",
        },
        401,
      );
    }

    const [scheme, secret] =
      authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !secret
    ) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "Authorization must use Bearer token authentication",
        },
        401,
      );
    }

    if (!secret.startsWith("mk_")) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid API key",
        },
        401,
      );
    }

    const keyHash =
      PostgresApiKeyStore.hash(secret);

    const apiKey =
      await apiKeys.getByHash(keyHash);

    if (!apiKey) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid API key",
        },
        401,
      );
    }

    if (apiKey.revokedAt) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "API key has been revoked",
        },
        401,
      );
    }

    c.set(
      apiKeyAuthKey,
      {
        apiKeyId: apiKey.id,
        projectId: apiKey.projectId,
      },
    );

    void apiKeys
      .markUsed(apiKey.id)
      .catch((error: unknown) => {
        console.error(
          "Failed to update API key lastUsedAt:",
          error,
        );
      });

    await next();
  };
}