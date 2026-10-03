import type {
  CreateSnapshotInput,
  Snapshot,
  SnapshotStore
} from "@mercy/core";

import {
  createId,
  sha256
} from "@mercy/shared";

import type { SnapshotStorage } from "../storage/storage";

export class LocalSnapshotStore implements SnapshotStore {
  constructor(
    private readonly storage: SnapshotStorage
  ) {}

  async create(
    input: CreateSnapshotInput
  ): Promise<Snapshot> {
    const id = createId();
    const storageKey = `${input.actionId}/${id}.snapshot`;

    const checksum = await sha256(input.data);

    await this.storage.put(
      storageKey,
      input.data
    );

    return {
      id,
      actionId: input.actionId,
      storageKey,
      checksum,
      size: input.data.byteLength,
      createdAt: new Date(),
      ...(input.metadata
        ? { metadata: input.metadata }
        : {})
    };
  }

  async get(
    snapshotId: string
  ): Promise<Snapshot | null> {
    // Metadata persistence will be added with the journal/database layer.
    return null;
  }

  async read(
    snapshotId: string
  ): Promise<Uint8Array> {
    throw new Error(
      `Snapshot metadata lookup not implemented yet: ${snapshotId}`
    );
  }

  async delete(
    snapshotId: string
  ): Promise<void> {
    throw new Error(
      `Snapshot metadata lookup not implemented yet: ${snapshotId}`
    );
  }
}