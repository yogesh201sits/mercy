export interface SnapshotStorage {
  put(
    key: string,
    data: Uint8Array
  ): Promise<void>;

  get(
    key: string
  ): Promise<Uint8Array>;

  delete(
    key: string
  ): Promise<void>;

  exists(
    key: string
  ): Promise<boolean>;
}