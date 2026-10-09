import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { PrismaClient } from "../../generated/prisma/client";

const API_KEY_PREFIX = "mk_";

export interface ApiKeyRecord {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
}

export interface CreateApiKeyInput {
  readonly projectId: string;
  readonly name: string;
}

export interface CreatedApiKey {
  readonly apiKey: ApiKeyRecord;
  readonly secret: string;
}

function hashApiKey(secret: string): string {
  return createHash("sha256")
    .update(secret)
    .digest("hex");
}

function generateApiKey(): string {
  const secret = randomBytes(32).toString("base64url");

  return `${API_KEY_PREFIX}${secret}`;
}

function getKeyPrefix(secret: string): string {
  return secret.slice(0, 12);
}

export class PostgresApiKeyStore {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateApiKeyInput): Promise<CreatedApiKey> {
    const secret = generateApiKey();
    const keyHash = hashApiKey(secret);
    const keyPrefix = getKeyPrefix(secret);

    const record = await this.db.apiKey.create({
      data: {
        id: randomUUID(),
        projectId: input.projectId,
        name: input.name,
        keyPrefix,
        keyHash,
      },
    });

    return {
      apiKey: record,
      secret,
    };
  }

  async getByHash(
    keyHash: string,
  ): Promise<ApiKeyRecord | null> {
    return this.db.apiKey.findUnique({
      where: {
        keyHash,
      },
    });
  }

  async listByProject(
    projectId: string,
  ): Promise<readonly ApiKeyRecord[]> {
    return this.db.apiKey.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async revoke(apiKeyId: string): Promise<ApiKeyRecord> {
    return this.db.apiKey.update({
      where: {
        id: apiKeyId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async markUsed(apiKeyId: string): Promise<void> {
    await this.db.apiKey.update({
      where: {
        id: apiKeyId,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  static hash(secret: string): string {
    return hashApiKey(secret);
  }
}