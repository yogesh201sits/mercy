import type {
  Action,
  ActionResult,
  UndoResult
} from "@mercy/core";
import type {
  ActionJournal,
  CreateJournalEntry,
  JournalEntry
} from "@mercy/journal";

import type { PrismaClient } from "../../generated/prisma/client";
import { mapPrismaOperation } from "../errors";
import { toPrismaJson } from "../json";

export class PostgresActionJournal
  implements ActionJournal
{
  constructor(
    private readonly prisma: PrismaClient
  ) {}

  async create(
    input: CreateJournalEntry
  ): Promise<JournalEntry> {
    const action =
      await this.prisma.action.create({
        data: {
          id: input.id,
          projectId: input.input.projectId,
          type: input.input.type,
          target: input.input.target,
          status: "pending",
          undoStrategy: input.undoStrategy,

          ...(input.input.metadata
            ? {
                metadata: toPrismaJson(
                  input.input.metadata
                )
              }
            : {})
        }
      });

    return this.toDomain(action);
  }

  async markSnapshotCreated(
    actionId: string,
    snapshotId: string
  ): Promise<JournalEntry> {
    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          beforeSnapshotId: snapshotId
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markRunning(
    actionId: string
  ): Promise<JournalEntry> {
    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "running",
          startedAt: new Date()
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markCompleted(
    actionId: string,
    result: ActionResult,
    afterHash?: string
  ): Promise<JournalEntry> {
    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "completed",
          completedAt: new Date(),
          result: toPrismaJson(result),

          ...(afterHash !== undefined
            ? {
                afterHash
              }
            : {})
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markFailed(
    actionId: string,
    error: string
  ): Promise<JournalEntry> {
    const result: ActionResult = {
      actionId,
      success: false,
      error
    };

    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "failed",
          completedAt: new Date(),
          result: toPrismaJson(result)
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markUndoing(
    actionId: string
  ): Promise<JournalEntry> {
    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "undoing"
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markUndone(
    actionId: string,
    result: UndoResult
  ): Promise<JournalEntry> {
    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "undone",
          undoResult: toPrismaJson(result)
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async markUndoFailed(
    actionId: string,
    error: string
  ): Promise<JournalEntry> {
    const result: UndoResult = {
      actionId,
      success: false,
      conflict: false,
      error
    };

    const action = await mapPrismaOperation(
      () => this.prisma.action.update({
        where: {
          id: actionId
        },
        data: {
          status: "undo_failed",
          undoResult: toPrismaJson(result)
        }
      }),
      "action"
    );

    return this.toDomain(action);
  }

  async get(
    actionId: string
  ): Promise<JournalEntry | null> {
    const action =
      await this.prisma.action.findUnique({
        where: {
          id: actionId
        }
      });

    return action
      ? this.toDomain(action)
      : null;
  }

  async list(
    projectId: string
  ): Promise<readonly JournalEntry[]> {
    const actions =
      await this.prisma.action.findMany({
        where: {
          projectId
        },
        orderBy: {
          createdAt: "desc"
        }
      });

    return actions.map(
      (action) => this.toDomain(action)
    );
  }

  private toDomain(action: {
    id: string;
    projectId: string;
    type: string;
    target: string;
    status: string;
    undoStrategy: string;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    beforeSnapshotId: string | null;
    afterHash: string | null;
    metadata: unknown;
    result: unknown;
    undoResult: unknown;
  }): JournalEntry {
    const base: Action = {
      id: action.id,
      projectId: action.projectId,
      type: action.type as Action["type"],
      target: action.target,
      status: action.status as Action["status"],
      undoStrategy:
        action.undoStrategy as Action["undoStrategy"],
      createdAt: action.createdAt,

      ...(action.startedAt
        ? {
            startedAt: action.startedAt
          }
        : {}),

      ...(action.completedAt
        ? {
            completedAt: action.completedAt
          }
        : {}),

      ...(action.beforeSnapshotId
        ? {
            beforeSnapshotId:
              action.beforeSnapshotId
          }
        : {}),

      ...(action.afterHash
        ? {
            afterHash: action.afterHash
          }
        : {}),

      ...(action.metadata
        ? {
            metadata:
              action.metadata as Record<
                string,
                unknown
              >
          }
        : {})
    };

    return {
      ...base,

      ...(action.result
        ? {
            result:
              action.result as ActionResult
          }
        : {}),

      ...(action.undoResult
        ? {
            undoResult:
              action.undoResult as UndoResult
          }
        : {})
    };
  }
}