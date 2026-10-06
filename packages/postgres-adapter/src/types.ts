import type { Pool } from "pg";

export interface PostgresRowActionMetadata {
  readonly primaryKey: string;
  readonly value: string | number;

  /**
   * Data used when creating a row.
   */
  readonly data?: Readonly<Record<string, unknown>>;

  /**
   * Fields changed by an update.
   */
  readonly changes?: Readonly<Record<string, unknown>>;
}

export interface PostgresSnapshotState {
  readonly kind: "postgres-row";
  readonly table: string;
  readonly primaryKey: string;
  readonly primaryKeyValue: string | number;
  readonly existed: boolean;
  readonly data?: Readonly<Record<string, unknown>>;
}


export interface PostgresAdapterOptions {
  readonly pool: Pool;

  /**
   * Restricts Mercy to tables explicitly registered by the client.
   *
   * Examples:
   * ["users", "orders"]
   * ["public.users", "public.orders"]
   */
  readonly allowedTables?: readonly string[];
}

export interface PostgresRowMetadata {
  /**
   * Primary-key column.
   */
  readonly primaryKey: string;

  /**
   * Primary-key value of the target row.
   */
  readonly primaryKeyValue: string | number;

  /**
   * Complete row data for CREATE.
   */
  readonly data?: Readonly<Record<string, unknown>>;

  /**
   * Fields to change for UPDATE.
   */
  readonly changes?: Readonly<Record<string, unknown>>;
}

export interface PostgresSnapshotState {
  readonly kind: "postgres-row";

  readonly table: string;

  readonly primaryKey: string;

  readonly primaryKeyValue: string | number;

  /**
   * Whether the row existed before the action.
   */
  readonly existed: boolean;

  /**
   * Complete row before the action.
   */
  readonly data?: Readonly<Record<string, unknown>>;
}