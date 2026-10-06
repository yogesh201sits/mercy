import { createHash } from "node:crypto";

import { MercyError } from "@mercy/shared";

import type {
  PostgresFilterOperator,
  PostgresRowFilter,
} from "./types";

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function validateIdentifier(
  identifier: string,
  name: string,
): void {
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new MercyError(
      "INVALID_INPUT",
      `Invalid PostgreSQL ${name}: ${identifier}`,
    );
  }
}

export function quoteIdentifier(identifier: string): string {
  validateIdentifier(identifier, "identifier");

  return `"${identifier}"`;
}

export interface ParsedTable {
  readonly schema?: string;
  readonly table: string;
}

export function parseTableTarget(target: string): ParsedTable {
  const parts = target.split(".");

  if (parts.length === 1) {
    validateIdentifier(parts[0]!, "table name");

    return {
      table: parts[0]!,
    };
  }

  if (parts.length === 2) {
    validateIdentifier(parts[0]!, "schema name");
    validateIdentifier(parts[1]!, "table name");

    return {
      schema: parts[0]!,
      table: parts[1]!,
    };
  }

  throw new MercyError(
    "INVALID_INPUT",
    `Invalid PostgreSQL table target: ${target}`,
  );
}

export function tableSql(target: string): string {
  const parsed = parseTableTarget(target);

  if (parsed.schema) {
    return `${quoteIdentifier(parsed.schema)}.${quoteIdentifier(parsed.table)}`;
  }

  return quoteIdentifier(parsed.table);
}

export function normalizeTableTarget(target: string): string {
  const parsed = parseTableTarget(target);

  return parsed.schema
    ? `${parsed.schema}.${parsed.table}`
    : parsed.table;
}

function stableValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return {
      type: "Buffer",
      data: Array.from(value),
    };
  }

  if (value instanceof Uint8Array) {
    return {
      type: "Uint8Array",
      data: Array.from(value),
    };
  }

  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const object = value as Record<string, unknown>;

    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, stableValue(object[key])]),
    );
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function hashValue(value: unknown): string {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
}

export function encodeSnapshot(
  state: unknown,
): Uint8Array {
  return new TextEncoder().encode(
    stableStringify(state),
  );
}

export function decodeSnapshot<T>(
  data: Uint8Array,
): T {
  const text = new TextDecoder().decode(data);

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new MercyError(
      "SNAPSHOT_FAILED",
      "Failed to decode PostgreSQL snapshot",
      {
        cause: error,
      },
    );
  }
}

export interface PostgresWhereClause {
  readonly sql: string;
  readonly values: readonly unknown[];
}

function quoteFilterIdentifier(identifier: string): string {
  validateIdentifier(identifier, "filter field");
  return quoteIdentifier(identifier);
}

export function buildWhereClause(
  filter: PostgresRowFilter,
): PostgresWhereClause {
  const column = quoteFilterIdentifier(filter.field);

  switch (filter.operator) {
    case "eq":
      return {
        sql: `${column} = $1`,
        values: [filter.value],
      };

    case "neq":
      return {
        sql: `${column} <> $1`,
        values: [filter.value],
      };

    case "gt":
      return {
        sql: `${column} > $1`,
        values: [filter.value],
      };

    case "gte":
      return {
        sql: `${column} >= $1`,
        values: [filter.value],
      };

    case "lt":
      return {
        sql: `${column} < $1`,
        values: [filter.value],
      };

    case "lte":
      return {
        sql: `${column} <= $1`,
        values: [filter.value],
      };

    case "in": {
      if (!Array.isArray(filter.value)) {
        throw new Error(
          "PostgreSQL IN filter requires an array value.",
        );
      }

      if (filter.value.length === 0) {
        throw new Error(
          "PostgreSQL IN filter cannot be empty.",
        );
      }

      const placeholders = filter.value.map(
        (_, index) => `$${index + 1}`,
      );

      return {
        sql: `${column} IN (${placeholders.join(", ")})`,
        values: filter.value,
      };
    }

    default:
      throw new Error(
        `Unsupported PostgreSQL filter operator: ${String(
          filter.operator,
        )}`,
      );
  }
}