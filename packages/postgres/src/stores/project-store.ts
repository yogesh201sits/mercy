import { randomUUID } from "node:crypto";

import type { PrismaClient } from "../../generated/prisma/client";

export interface ProjectRecord {
  readonly id: string;
  readonly name: string;
  readonly clerkUserId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly clerkUserId: string;
}

export class PostgresProjectStore {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const project = await this.db.project.create({
      data: {
        id: randomUUID(),
        name: input.name,
        clerkUserId: input.clerkUserId,
      },
    });

    return project;
  }

  async get(projectId: string): Promise<ProjectRecord | null> {
    return this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });
  }

  async listByClerkUser(
    clerkUserId: string,
  ): Promise<readonly ProjectRecord[]> {
    return this.db.project.findMany({
      where: {
        clerkUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async delete(projectId: string): Promise<void> {
    await this.db.project.delete({
      where: {
        id: projectId,
      },
    });
  }
}