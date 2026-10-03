import type { Snapshot } from "./types";

export interface SnapshotStore {
  create(input: CreateSnapshotInput): Promise<Snapshot>;

  get(snapshotId: string): Promise<Snapshot | null>;

  read(snapshotId: string): Promise<Uint8Array>;

  delete(snapshotId: string): Promise<void>;
}

export interface CreateSnapshotInput {
  readonly actionId: string;
  readonly data: Uint8Array;
  readonly metadata?: Readonly<Record<string, unknown>>;
}