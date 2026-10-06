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

/**
 * Snapshot state for a single PostgreSQL row.
 */
export interface PostgresSnapshotState {
  readonly kind: "postgres-row";
  readonly table: string;
  readonly primaryKey: string;
  readonly primaryKeyValue: string | number;
  readonly existed: boolean;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * Supported operators for bulk PostgreSQL row filtering.
 */
export type PostgresFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in";

/**
 * Structured PostgreSQL row filter.
 *
 * Values are always passed separately to PostgreSQL
 * as query parameters.
 */
export interface PostgresRowFilter {
  readonly field: string;
  readonly operator: PostgresFilterOperator;
  readonly value: unknown;
}

/**
 * Metadata for a PostgreSQL bulk row action.
 */
export interface PostgresBulkActionMetadata {
  readonly operation: "delete_rows";
  readonly primaryKey: string;
  readonly where: PostgresRowFilter;
}

/**
 * Snapshot state for a bulk PostgreSQL row operation.
 */
export interface PostgresRowsSnapshotState {
  readonly kind: "postgres-rows";
  readonly table: string;
  readonly primaryKey: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}