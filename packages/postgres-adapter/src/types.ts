import type { Pool } from "pg";

export interface PostgresAdapterOptions {
  readonly pool: Pool;
  readonly allowedTables?: readonly string[];
}

export interface PostgresRowMetadata {
  readonly primaryKey: string;
  readonly primaryKeyValue: string | number;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly changes?: Readonly<Record<string, unknown>>;
}

export type PostgresFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

export interface PostgresRowFilter {
  readonly field: string;
  readonly operator: PostgresFilterOperator;
  readonly value: unknown;
}

export interface PostgresBulkActionMetadata {
  readonly operation: "delete_rows" | "update_rows";
  readonly primaryKey: string;
  readonly where: PostgresRowFilter;
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

export interface PostgresRowsSnapshotState {
  readonly kind: "postgres-rows";
  readonly table: string;
  readonly primaryKey: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}