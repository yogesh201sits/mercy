import type {
  Snapshot
} from "@mercy/core";

import type {
  PrismaClient
} from "../../generated/prisma/client";

import { mapPrismaOperation } from "../errors";
import { toPrismaJson } from "../json";

export class PostgresSnapshotRepository {
  constructor(
    private readonly prisma: PrismaClient
  ) {}

  async create(
    snapshot: Snapshot
  ): Promise<Snapshot> {
    const created =
      await this.prisma.actionSnapshot.create({
        data: {
          id: snapshot.id,
          actionId: snapshot.actionId,
          storageKey: snapshot.storageKey,
          checksum: snapshot.checksum,
          size: snapshot.size,

          ...(snapshot.metadata
            ? {
                metadata: toPrismaJson(snapshot.metadata)
              }
            : {}),

          createdAt:
            snapshot.createdAt
        }
      });

    return this.toDomain(created);
  }

  async get(
    snapshotId: string
  ): Promise<Snapshot | null> {
    const snapshot =
      await this.prisma.actionSnapshot.findUnique({
        where: {
          id: snapshotId
        }
      });

    return snapshot
      ? this.toDomain(snapshot)
      : null;
  }

  async delete(
    snapshotId: string
  ): Promise<void> {
    await mapPrismaOperation(
      () => this.prisma.actionSnapshot.delete({
        where: {
          id: snapshotId
        }
      }),
      "snapshot"
    );
  }

  private toDomain(
    snapshot: {
      id: string;
      actionId: string;
      storageKey: string;
      checksum: string;
      size: number;
      metadata: unknown;
      createdAt: Date;
    }
  ): Snapshot {
    return {
      id: snapshot.id,
      actionId: snapshot.actionId,
      storageKey: snapshot.storageKey,
      checksum: snapshot.checksum,
      size: snapshot.size,
      createdAt: snapshot.createdAt,

      ...(snapshot.metadata
        ? {
            metadata:
              snapshot.metadata as Record<
                string,
                unknown
              >
          }
        : {})
    };
  }
}