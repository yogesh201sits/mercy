export interface Snapshot {
  readonly id: string;
  readonly actionId: string;

  readonly storageKey: string;
  readonly checksum: string;
  readonly size: number;

  readonly createdAt: Date;

  readonly metadata?: Readonly<
    Record<string, unknown>
  >;
}

export interface CapturedState {
  readonly data: Uint8Array;

  readonly metadata?: Readonly<
    Record<string, unknown>
  >;
}