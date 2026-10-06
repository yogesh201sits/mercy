import type {
  Action,
  ActionAdapter,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "@mercy/core";

import { MercyError } from "@mercy/shared";

import type {
  Pool,
  QueryResultRow,
} from "pg";

import type {
  PostgresAdapterOptions,
  PostgresBulkActionMetadata,
  PostgresRowMetadata,
  PostgresRowsSnapshotState,
  PostgresSnapshotState,
} from "./types";

import {
  buildWhereClause,
  decodeSnapshot,
  encodeSnapshot,
  hashValue,
  normalizeTableTarget,
  quoteIdentifier,
  tableSql,
  validateIdentifier,
} from "./utils";

export class PostgresAdapter implements ActionAdapter {
  readonly name = "postgres";

  private readonly pool: Pool;

  private readonly allowedTables?: ReadonlySet<string>;

  constructor(
    options: PostgresAdapterOptions,
  ) {
    this.pool = options.pool;

    if (options.allowedTables) {
      this.allowedTables = new Set(
        options.allowedTables.map(
          normalizeTableTarget,
        ),
      );
    }
  }

  canHandle(
    input: ActionInput,
  ): boolean {
    const table =
      normalizeTableTarget(input.target);

    const tableAllowed =
      !this.allowedTables ||
      this.allowedTables.size === 0 ||
      this.allowedTables.has(table);

    if (
      input.type === "create" ||
      input.type === "update" ||
      input.type === "delete"
    ) {
      return tableAllowed;
    }

    if (input.type === "custom") {
      const bulkMetadata =
        this.getBulkMetadata(input);

      return (
        bulkMetadata !== null &&
        (
          bulkMetadata.operation === "delete_rows" ||
          bulkMetadata.operation === "update_rows"
        ) &&
        tableAllowed
      );
    }

    return false;
  }

  async prepare(
    input: ActionInput,
  ): Promise<PreparedAction> {
    const bulkMetadata =
      this.getBulkMetadata(input);

    if (bulkMetadata) {
      if (!this.canHandle(input)) {
        throw new MercyError(
          "ADAPTER_NOT_FOUND",
          `PostgreSQL adapter cannot handle target: ${input.target}`,
        );
      }

      validateIdentifier(
        bulkMetadata.primaryKey,
        "primary-key column",
      );

      validateIdentifier(
        bulkMetadata.where.field,
        "filter column",
      );

      if (bulkMetadata.changes) {
        for (const field of Object.keys(
          bulkMetadata.changes,
        )) {
          validateIdentifier(
            field,
            "update field",
          );
        }
      }

      return {
        actionId:
          typeof input.metadata?.["actionId"] ===
            "string"
            ? input.metadata["actionId"]
            : crypto.randomUUID(),

        input,

        undoStrategy: "restore",

        metadata: {
          ...input.metadata,

          operation:
            bulkMetadata.operation,

          primaryKey:
            bulkMetadata.primaryKey,

          where:
            bulkMetadata.where,

          ...(bulkMetadata.changes
            ? {
                changes:
                  bulkMetadata.changes,
              }
            : {}),
        },
      };
    }

    if (!this.canHandle(input)) {
      throw new MercyError(
        "ADAPTER_NOT_FOUND",
        `PostgreSQL adapter cannot handle target: ${input.target}`,
      );
    }

    const metadata =
      this.getMetadata(input);

    validateIdentifier(
      metadata.primaryKey,
      "primary-key column",
    );

    if (
      input.type === "create" &&
      (!metadata.data ||
        Object.keys(metadata.data).length === 0)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL CREATE requires metadata.data",
      );
    }

    if (
      input.type === "update" &&
      (!metadata.changes ||
        Object.keys(metadata.changes).length === 0)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL UPDATE requires metadata.changes",
      );
    }

    return {
      actionId:
        this.getActionId(input),

      input,

      undoStrategy: "restore",

      ...(input.metadata
        ? {
            metadata: input.metadata,
          }
        : {}),
    };
  }

  async snapshot(
    action: PreparedAction,
  ): Promise<CapturedState> {
    const bulkMetadata =
      this.getBulkMetadata(
        action.input,
      );

    if (bulkMetadata) {
      const where =
        buildWhereClause(
          bulkMetadata.where,
        );

      const result =
        await this.pool.query(
          `
          SELECT *
          FROM ${tableSql(action.input.target)}
          WHERE ${where.sql}
          `,
          [...where.values],
        );

      const rows =
        result.rows as Readonly<
          Record<string, unknown>
        >[];

      const state:
        PostgresRowsSnapshotState = {
        kind: "postgres-rows",

        table:
          normalizeTableTarget(
            action.input.target,
          ),

        primaryKey:
          bulkMetadata.primaryKey,

        rows,
      };

      return {
        data: encodeSnapshot(state),

        metadata: {
          kind: state.kind,

          table: state.table,

          primaryKey:
            state.primaryKey,

          rowCount:
            state.rows.length,
        },
      };
    }

    const metadata =
      this.getMetadata(
        action.input,
      );

    const row =
      await this.getRow(
        action.input.target,
        metadata.primaryKey,
        metadata.primaryKeyValue,
      );

    const state:
      PostgresSnapshotState = {
      kind: "postgres-row",

      table:
        normalizeTableTarget(
          action.input.target,
        ),

      primaryKey:
        metadata.primaryKey,

      primaryKeyValue:
        metadata.primaryKeyValue,

      existed:
        row !== null,

      ...(row !== null
        ? {
            data: row,
          }
        : {}),
    };

    return {
      data: encodeSnapshot(state),

      metadata: {
        kind: state.kind,

        table: state.table,

        primaryKey:
          state.primaryKey,

        primaryKeyValue:
          state.primaryKeyValue,

        existed:
          state.existed,
      },
    };
  }

  async execute(
    action: PreparedAction,
  ): Promise<ActionResult> {
    try {
      const bulkMetadata =
        this.getBulkMetadata(
          action.input,
        );

      if (
        bulkMetadata?.operation ===
        "delete_rows"
      ) {
        return await this.executeDeleteRows(
          action,
          bulkMetadata,
        );
      }

      if (
        bulkMetadata?.operation ===
        "update_rows"
      ) {
        return await this.executeUpdateRows(
          action,
          bulkMetadata,
        );
      }

      const metadata =
        this.getMetadata(
          action.input,
        );

      let row:
        QueryResultRow | null;

      switch (action.input.type) {
        case "create":
          row =
            await this.createRow(
              action.input.target,
              metadata,
            );
          break;

        case "update":
          row =
            await this.updateRow(
              action.input.target,
              metadata,
            );
          break;

        case "delete":
          row =
            await this.deleteRow(
              action.input.target,
              metadata,
            );
          break;

        default:
          throw new MercyError(
            "INVALID_INPUT",
            `Unsupported PostgreSQL action type: ${action.input.type}`,
          );
      }

      const afterRow =
        action.input.type === "delete"
          ? null
          : row;

      const state = {
        kind:
          "postgres-row-current",

        table:
          normalizeTableTarget(
            action.input.target,
          ),

        primaryKey:
          metadata.primaryKey,

        primaryKeyValue:
          metadata.primaryKeyValue,

        existed:
          afterRow !== null,

        ...(afterRow !== null
          ? {
              data: afterRow,
            }
          : {}),
      };

      return {
        actionId:
          action.actionId,

        success: true,

        result: row,

        afterHash:
          hashValue(state),
      };
    } catch (error) {
      if (error instanceof MercyError) {
        return {
          actionId:
            action.actionId,

          success: false,

          error:
            error.message,
        };
      }

      return {
        actionId:
          action.actionId,

        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  }

  private async undoUpdateRows(
    action: Action,
    state: PostgresRowsSnapshotState,
  ): Promise<UndoResult> {
    const verification =
      await this.verify(action);

    if (!verification.valid) {
      return {
        actionId:
          action.id,

        success: false,

        conflict:
          verification.conflict,

        error:
          verification.reason ??
          "PostgreSQL rows have changed since the action completed",
      };
    }

    const table =
      normalizeTableTarget(
        state.table,
      );

    for (const row of state.rows) {
      const primaryKeyValue =
        row[state.primaryKey];

      if (
        primaryKeyValue === undefined
      ) {
        return {
          actionId:
            action.id,

          success: false,

          conflict: false,

          error:
            `Snapshot row is missing primary key "${state.primaryKey}"`,
        };
      }

      const entries =
        Object.entries(row);

      const setClauses: string[] = [];

      const values: unknown[] = [];

      for (
        const [field, value]
        of entries
      ) {
        if (
          field ===
          state.primaryKey
        ) {
          continue;
        }

        validateIdentifier(
          field,
          "restore field",
        );

        setClauses.push(
          `${quoteIdentifier(field)} = $${values.length + 1}`,
        );

        values.push(value);
      }

      if (
        setClauses.length === 0
      ) {
        continue;
      }

      values.push(
        primaryKeyValue,
      );

      await this.pool.query(
        `
        UPDATE ${quoteIdentifier(table)}
        SET ${setClauses.join(", ")}
        WHERE ${quoteIdentifier(state.primaryKey)} = $${values.length}
        `,
        values,
      );
    }

    return {
      actionId:
        action.id,

      success: true,

      conflict: false,
    };
  }

  async undo(
    action: Action,
    snapshot: Snapshot,
    data: Uint8Array,
  ): Promise<UndoResult> {
    try {
      const state =
        decodeSnapshot<
          PostgresSnapshotState |
          PostgresRowsSnapshotState
        >(data);

      if (
        state.kind ===
        "postgres-rows"
      ) {
        const metadata =
          this.getBulkMetadataFromAction(
            action,
          );

        if (
          metadata?.operation ===
          "update_rows"
        ) {
          return await this.undoUpdateRows(
            action,
            state,
          );
        }

        return await this.undoDeleteRows(
          action,
          state,
        );
      }

      const verification =
        await this.verify(action);

      if (
        verification.conflict
      ) {
        return {
          actionId:
            action.id,

          success: false,

          conflict: true,

          error:
            verification.reason ??
            "PostgreSQL row changed after the action",
        };
      }

      if (
        state.kind !==
        "postgres-row"
      ) {
        return {
          actionId:
            action.id,

          success: false,

          conflict: false,

          error:
            "Unsupported PostgreSQL snapshot kind",
        };
      }

      if (
        state.table !==
        normalizeTableTarget(
          action.target,
        )
      ) {
        throw new MercyError(
          "SNAPSHOT_FAILED",
          "Snapshot target does not match action target",
        );
      }

      if (state.existed) {
        if (!state.data) {
          throw new MercyError(
            "SNAPSHOT_FAILED",
            "PostgreSQL snapshot is missing row data",
          );
        }

        await this.restoreRow(
          state.table,
          state.primaryKey,
          state.primaryKeyValue,
          state.data,
        );
      } else {
        await this.removeRow(
          state.table,
          state.primaryKey,
          state.primaryKeyValue,
        );
      }

      return {
        actionId:
          action.id,

        success: true,

        conflict: false,
      };
    } catch (error) {
      return {
        actionId:
          action.id,

        success: false,

        conflict: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  }

  async verify(
    action: Action,
  ): Promise<VerificationResult> {
    if (!action.afterHash) {
      return {
        valid: false,

        conflict: false,

        reason:
          "Action does not contain an after-action hash",
      };
    }

    try {
      const bulkMetadata =
        this.getBulkMetadataFromAction(
          action,
        );

      if (bulkMetadata) {
        return await this.verifyBulkRows(
          action,
          bulkMetadata,
        );
      }

      const metadata =
        this.getMetadataFromAction(
          action,
        );

      const row =
        await this.getRow(
          action.target,
          metadata.primaryKey,
          metadata.primaryKeyValue,
        );

      const currentState = {
        kind:
          "postgres-row-current",

        table:
          normalizeTableTarget(
            action.target,
          ),

        primaryKey:
          metadata.primaryKey,

        primaryKeyValue:
          metadata.primaryKeyValue,

        existed:
          row !== null,

        ...(row !== null
          ? {
              data: row,
            }
          : {}),
      };

      const currentHash =
        hashValue(
          currentState,
        );

      if (
        currentHash !==
        action.afterHash
      ) {
        return {
          valid: false,

          conflict: true,

          reason:
            "PostgreSQL row has changed since the action completed",
        };
      }

      return {
        valid: true,

        conflict: false,
      };
    } catch (error) {
      return {
        valid: false,

        conflict: false,

        reason:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  }

  private async executeDeleteRows(
    action: PreparedAction,
    metadata: PostgresBulkActionMetadata,
  ): Promise<ActionResult> {
    const where =
      buildWhereClause(
        metadata.where,
      );

    const result =
      await this.pool.query(
        `
        DELETE FROM ${tableSql(action.input.target)}
        WHERE ${where.sql}
        RETURNING *
        `,
        [...where.values],
      );

    const afterState = {
      kind:
        "postgres-rows-current",

      table:
        normalizeTableTarget(
          action.input.target,
        ),

      primaryKey:
        metadata.primaryKey,

      rows: [],
    };

    return {
      actionId:
        action.actionId,

      success: true,

      result:
        result.rows,

      afterHash:
        hashValue(afterState),
    };
  }

  private async executeUpdateRows(
    action: PreparedAction,
    metadata: PostgresBulkActionMetadata,
  ): Promise<ActionResult> {
    if (!metadata.changes) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL update_rows requires changes.",
      );
    }

    const table =
      normalizeTableTarget(
        action.input.target,
      );

    const entries =
      Object.entries(
        metadata.changes,
      );

    if (entries.length === 0) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL update_rows requires at least one change.",
      );
    }

    const setClauses: string[] = [];

    const values: unknown[] = [];

    for (
      const [field, value]
      of entries
    ) {
      validateIdentifier(
        field,
        "update field",
      );

      setClauses.push(
        `${quoteIdentifier(field)} = $${values.length + 1}`,
      );

      values.push(value);
    }

    const where =
      buildWhereClause(
        metadata.where,
      );

    const whereValues =
      [...where.values];

    const offset =
      values.length;

    const adjustedWhereSql =
      where.sql.replace(
        /\$(\d+)/g,
        (
          _match,
          index: string,
        ) =>
          `$${Number(index) + offset}`,
      );

    values.push(
      ...whereValues,
    );

    const result =
      await this.pool.query(
        `
        UPDATE ${tableSql(table)}
        SET ${setClauses.join(", ")}
        WHERE ${adjustedWhereSql}
        RETURNING *
        `,
        values,
      );

    const rows =
      result.rows as Readonly<
        Record<string, unknown>
      >[];

    const afterState = {
      kind:
        "postgres-rows-current",

      table,

      primaryKey:
        metadata.primaryKey,

      rows,
    };

    return {
      actionId:
        action.actionId,

      success: true,

      result: {
        affectedRows:
          rows.length,

        rows,
      },

      afterHash:
        hashValue(
          afterState,
        ),
    };
  }

  private async undoDeleteRows(
    action: Action,
    state: PostgresRowsSnapshotState,
  ): Promise<UndoResult> {
    const verification =
      await this.verify(action);

    if (
      verification.conflict
    ) {
      return {
        actionId:
          action.id,

        success: false,

        conflict: true,

        error:
          verification.reason ??
          "PostgreSQL rows changed since the action completed",
      };
    }

    if (
      state.table !==
      normalizeTableTarget(
        action.target,
      )
    ) {
      throw new MercyError(
        "SNAPSHOT_FAILED",
        "Snapshot target does not match action target",
      );
    }

    for (
      const row of state.rows
    ) {
      await this.restoreRow(
        state.table,

        state.primaryKey,

        this.getPrimaryKeyValue(
          row,
          state.primaryKey,
        ),

        row,
      );
    }

    return {
      actionId:
        action.id,

      success: true,

      conflict: false,
    };
  }

  private async verifyBulkRows(
    action: Action,
    metadata: PostgresBulkActionMetadata,
  ): Promise<VerificationResult> {
    const where =
      buildWhereClause(
        metadata.where,
      );

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM ${tableSql(action.target)}
        WHERE ${where.sql}
        `,
        [...where.values],
      );

    const rows =
      result.rows as Readonly<
        Record<string, unknown>
      >[];

    const currentState = {
      kind:
        "postgres-rows-current",

      table:
        normalizeTableTarget(
          action.target,
        ),

      primaryKey:
        metadata.primaryKey,

      rows,
    };

    const currentHash =
      hashValue(
        currentState,
      );

    if (
      currentHash !==
      action.afterHash
    ) {
      return {
        valid: false,

        conflict: true,

        reason:
          "PostgreSQL rows have changed since the action completed",
      };
    }

    return {
      valid: true,

      conflict: false,
    };
  }

  private getBulkMetadata(
    input: ActionInput,
  ): PostgresBulkActionMetadata | null {
    if (
      input.type !== "custom" ||
      !input.metadata ||
      typeof input.metadata["operation"] !==
        "string"
    ) {
      return null;
    }

    const operation =
      input.metadata["operation"];

    if (
      operation !== "delete_rows" &&
      operation !== "update_rows"
    ) {
      return null;
    }

    const primaryKey =
      input.metadata["primaryKey"];

    if (
      typeof primaryKey !==
      "string"
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL bulk action requires a primaryKey.",
      );
    }

    const where =
      input.metadata["where"];

    if (
      !where ||
      typeof where !== "object" ||
      Array.isArray(where)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL bulk action requires a where filter.",
      );
    }

    const filter =
      where as Record<
        string,
        unknown
      >;

    if (
      typeof filter["field"] !==
        "string" ||
      typeof filter["operator"] !==
        "string" ||
      !("value" in filter)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "Invalid PostgreSQL where filter.",
      );
    }

    const changesValue =
      input.metadata["changes"];

    if (
      operation ===
      "update_rows"
    ) {
      if (
        !changesValue ||
        typeof changesValue !==
          "object" ||
        Array.isArray(changesValue)
      ) {
        throw new MercyError(
          "INVALID_INPUT",
          "PostgreSQL update_rows requires changes.",
        );
      }

      if (
        Object.keys(
          changesValue,
        ).length === 0
      ) {
        throw new MercyError(
          "INVALID_INPUT",
          "PostgreSQL update_rows requires at least one change.",
        );
      }
    }

    return {
      operation,

      primaryKey,

      where: {
        field:
          filter["field"],

        operator:
          filter[
            "operator"
          ] as PostgresBulkActionMetadata[
            "where"
          ]["operator"],

        value:
          filter["value"],
      },

      ...(operation ===
      "update_rows"
        ? {
            changes:
              changesValue as Readonly<
                Record<
                  string,
                  unknown
                >
              >,
          }
        : {}),
    };
  }

  private getBulkMetadataFromAction(
    action: Action,
  ): PostgresBulkActionMetadata | null {
    if (!action.metadata) {
      return null;
    }

    return this.getBulkMetadata({
      projectId:
        action.projectId,

      type:
        action.type,

      target:
        action.target,

      metadata:
        action.metadata,
    });
  }

  private getPrimaryKeyValue(
    row:
      Readonly<
        Record<string, unknown>
      >,
    primaryKey: string,
  ): string | number {
    const value =
      row[primaryKey];

    if (
      typeof value !==
        "string" &&
      typeof value !==
        "number"
    ) {
      throw new MercyError(
        "SNAPSHOT_FAILED",
        `PostgreSQL snapshot row is missing a valid primary-key value: ${primaryKey}`,
      );
    }

    return value;
  }

  private async createRow(
    target: string,
    metadata: PostgresRowMetadata,
  ): Promise<QueryResultRow> {
    if (!metadata.data) {
      throw new MercyError(
        "INVALID_INPUT",
        "CREATE requires row data",
      );
    }

    const entries =
      Object.entries(
        metadata.data,
      );

    if (entries.length === 0) {
      throw new MercyError(
        "INVALID_INPUT",
        "CREATE requires at least one column",
      );
    }

    const columns =
      entries.map(
        ([column]) => {
          validateIdentifier(
            column,
            "column name",
          );

          return `"${column}"`;
        },
      );

    const placeholders =
      entries.map(
        (_, index) =>
          `$${index + 1}`,
      );

    const values =
      entries.map(
        ([, value]) =>
          value,
      );

    const sql = `
      INSERT INTO ${tableSql(target)}
        (${columns.join(", ")})
      VALUES
        (${placeholders.join(", ")})
      RETURNING *
    `;

    const result =
      await this.pool.query(
        sql,
        values,
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new MercyError(
        "ACTION_FAILED",
        "PostgreSQL CREATE did not return a row",
      );
    }

    return row;
  }

  private async updateRow(
    target: string,
    metadata: PostgresRowMetadata,
  ): Promise<QueryResultRow> {
    if (!metadata.changes) {
      throw new MercyError(
        "INVALID_INPUT",
        "UPDATE requires changes",
      );
    }

    const entries =
      Object.entries(
        metadata.changes,
      );

    if (entries.length === 0) {
      throw new MercyError(
        "INVALID_INPUT",
        "UPDATE requires at least one changed column",
      );
    }

    for (
      const [column]
      of entries
    ) {
      validateIdentifier(
        column,
        "column name",
      );
    }

    if (
      entries.some(
        ([column]) =>
          column ===
          metadata.primaryKey,
      )
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "UPDATE cannot modify the primary-key column",
      );
    }

    const setClauses =
      entries.map(
        ([column], index) =>
          `"${column}" = $${index + 1}`,
      );

    const values =
      entries.map(
        ([, value]) =>
          value,
      );

    values.push(
      metadata.primaryKeyValue,
    );

    const sql = `
      UPDATE ${tableSql(target)}
      SET ${setClauses.join(", ")}
      WHERE ${quote(metadata.primaryKey)} = $${values.length}
      RETURNING *
    `;

    const result =
      await this.pool.query(
        sql,
        values,
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new MercyError(
        "ACTION_FAILED",
        `PostgreSQL row not found for UPDATE: ${metadata.primaryKey}=${metadata.primaryKeyValue}`,
      );
    }

    return row;
  }

  private async deleteRow(
    target: string,
    metadata: PostgresRowMetadata,
  ): Promise<QueryResultRow | null> {
    const sql = `
      DELETE FROM ${tableSql(target)}
      WHERE ${quote(metadata.primaryKey)} = $1
      RETURNING *
    `;

    const result =
      await this.pool.query(
        sql,
        [
          metadata.primaryKeyValue,
        ],
      );

    return (
      result.rows[0] ??
      null
    );
  }

  private async restoreRow(
    target: string,
    primaryKey: string,
    primaryKeyValue:
      string | number,
    data:
      Readonly<
        Record<string, unknown>
      >,
  ): Promise<void> {
    const entries =
      Object.entries(data);

    if (entries.length === 0) {
      throw new MercyError(
        "SNAPSHOT_FAILED",
        "Cannot restore an empty PostgreSQL row",
      );
    }

    for (
      const [column]
      of entries
    ) {
      validateIdentifier(
        column,
        "column name",
      );
    }

    const columns =
      entries.map(
        ([column]) =>
          quote(column),
      );

    const placeholders =
      entries.map(
        (_, index) =>
          `$${index + 1}`,
      );

    const values =
      entries.map(
        ([, value]) =>
          value,
      );

    const updates =
      entries
        .filter(
          ([column]) =>
            column !==
            primaryKey,
        )
        .map(
          ([column]) =>
            `${quote(column)} = EXCLUDED.${quote(column)}`,
        );

    const sql = `
      INSERT INTO ${tableSql(target)}
        (${columns.join(", ")})
      VALUES
        (${placeholders.join(", ")})
      ON CONFLICT (${quote(primaryKey)})
      DO UPDATE SET
        ${
          updates.length > 0
            ? updates.join(", ")
            : `${quote(primaryKey)} = EXCLUDED.${quote(primaryKey)}`
        }
    `;

    await this.pool.query(
      sql,
      values,
    );

    const restored =
      await this.getRow(
        target,
        primaryKey,
        primaryKeyValue,
      );

    if (!restored) {
      throw new MercyError(
        "UNDO_FAILED",
        "PostgreSQL row could not be restored",
      );
    }
  }

  private async removeRow(
    target: string,
    primaryKey: string,
    primaryKeyValue:
      string | number,
  ): Promise<void> {
    const sql = `
      DELETE FROM ${tableSql(target)}
      WHERE ${quote(primaryKey)} = $1
    `;

    await this.pool.query(
      sql,
      [
        primaryKeyValue,
      ],
    );
  }

  private async getRow(
    target: string,
    primaryKey: string,
    primaryKeyValue:
      string | number,
  ): Promise<QueryResultRow | null> {
    const sql = `
      SELECT *
      FROM ${tableSql(target)}
      WHERE ${quote(primaryKey)} = $1
      LIMIT 1
    `;

    const result =
      await this.pool.query(
        sql,
        [
          primaryKeyValue,
        ],
      );

    return (
      result.rows[0] ??
      null
    );
  }

  private getMetadata(
    input: ActionInput,
  ): PostgresRowMetadata {
    if (!input.metadata) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL actions require metadata",
      );
    }

    const metadata =
      input.metadata as Record<
        string,
        unknown
      >;

    const primaryKey =
      metadata["primaryKey"];

    const primaryKeyValue =
      metadata[
        "primaryKeyValue"
      ];

    if (
      typeof primaryKey !==
        "string" ||
      primaryKey.length === 0
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL action requires metadata.primaryKey",
      );
    }

    if (
      typeof primaryKeyValue !==
        "string" &&
      typeof primaryKeyValue !==
        "number"
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL action requires a string or number metadata.primaryKeyValue",
      );
    }

    const data =
      this.recordOrUndefined(
        metadata["data"],
      );

    const changes =
      this.recordOrUndefined(
        metadata["changes"],
      );

    return {
      primaryKey,

      primaryKeyValue,

      ...(data
        ? {
            data,
          }
        : {}),

      ...(changes
        ? {
            changes,
          }
        : {}),
    };
  }

  private getMetadataFromAction(
    action: Action,
  ): PostgresRowMetadata {
    if (!action.metadata) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL action metadata is missing",
      );
    }

    return this.getMetadata({
      projectId:
        action.projectId,

      type:
        action.type,

      target:
        action.target,

      metadata:
        action.metadata,
    });
  }

  private recordOrUndefined(
    value: unknown,
  ):
    | Readonly<
        Record<string, unknown>
      >
    | undefined {
    if (
      value === null ||
      typeof value !==
        "object" ||
      Array.isArray(value)
    ) {
      return undefined;
    }

    return value as Readonly<
      Record<string, unknown>
    >;
  }

  private getActionId(
    input: ActionInput,
  ): string {
    const metadata =
      input.metadata;

    if (!metadata) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL action requires metadata",
      );
    }

    const actionId =
      metadata["actionId"];

    if (
      typeof actionId !==
        "string" ||
      actionId.length === 0
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "PostgreSQL action requires metadata.actionId",
      );
    }

    return actionId;
  }
}

function quote(
  identifier: string,
): string {
  validateIdentifier(
    identifier,
    "identifier",
  );

  return `"${identifier}"`;
}