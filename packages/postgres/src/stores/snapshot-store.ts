import type {
  CreateSnapshotInput,
  Snapshot,
  SnapshotStore
} from "@mercy/core";
import { MercyError } from "@mercy/shared";

import type { PrismaClient } from "../../generated/prisma/client";
import {
  PostgresSnapshotRepository
} from "../repositories/snapshot-repository";
import type { SnapshotStorage } from "@mercy/snapshots";

export class PostgresSnapshotStore
  implements SnapshotStore
{
  private readonly repository: PostgresSnapshotRepository;

  constructor(
    prisma: PrismaClient,
    private readonly storage: SnapshotStorage
  ) {
    this.repository =
      new PostgresSnapshotRepository(prisma);
  }

  async create(
    input: CreateSnapshotInput
  ): Promise<Snapshot> {
    const snapshotId = crypto.randomUUID();

    const storageKey =
      `${input.actionId}/${snapshotId}.snapshot`;

    const checksum =
      await this.hash(input.data);

    await this.storage.put(
      storageKey,
      input.data
    );

    const snapshot: Snapshot = {
      id: snapshotId,
      actionId: input.actionId,
      storageKey,
      checksum,
      size: input.data.byteLength,
      createdAt: new Date(),

      ...(input.metadata
        ? {
            metadata: input.metadata
          }
        : {})
    };

    try {
      return await this.repository.create(
        snapshot
      );
    } catch (error) {
      // Metadata persistence failed.
      // Remove the already-written bytes so
      // we don't leave an orphaned snapshot.
      await this.storage.delete(
        storageKey
      );

      throw new MercyError(
        "SNAPSHOT_FAILED",
        `Failed to persist snapshot: ${snapshotId}`,
        { cause: error }
      );
    }
  }

  async get(
    snapshotId: string
  ): Promise<Snapshot | null> {
    return this.repository.get(
      snapshotId
    );
  }

  async read(
    snapshotId: string
  ): Promise<Uint8Array> {
    const snapshot =
      await this.repository.get(
        snapshotId
      );

    if (!snapshot) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `Snapshot not found: ${snapshotId}`
      );
    }

    return this.storage.get(
      snapshot.storageKey
    );
  }

  async delete(
    snapshotId: string
  ): Promise<void> {
    const snapshot =
      await this.repository.get(
        snapshotId
      );

    if (!snapshot) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `Snapshot not found: ${snapshotId}`
      );
    }

    await this.storage.delete(
      snapshot.storageKey
    );

    await this.repository.delete(
      snapshotId
    );
  }

  private async hash(
    data: Uint8Array
  ): Promise<string> {
    const buffer =
      new ArrayBuffer(data.byteLength);

    new Uint8Array(buffer).set(data);

    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        buffer
      );

    return Array.from(
      new Uint8Array(hashBuffer)
    )
      .map((byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
      )
      .join("");
  }
}