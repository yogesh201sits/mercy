import type {
  ActionResult,
  ActionStatus,
  UndoResult
} from "@mercy/core";
import { MercyError } from "@mercy/shared";

import type {
  ActionJournal,
  CreateJournalEntry,
  JournalEntry
} from "./types";

export class InMemoryActionJournal
  implements ActionJournal
{
  private readonly entries = new Map<
    string,
    JournalEntry
  >();

  async create(
    input: CreateJournalEntry
  ): Promise<JournalEntry> {
    if (this.entries.has(input.id)) {
      throw new MercyError(
        "ACTION_FAILED",
        `Action already exists: ${input.id}`
      );
    }

    const entry: JournalEntry = {
      id: input.id,
      projectId: input.input.projectId,
      type: input.input.type,
      target: input.input.target,
      status: "pending",
      createdAt: new Date(),
      undoStrategy: input.undoStrategy,

      ...(input.input.metadata
        ? {
            metadata: input.input.metadata
          }
        : {})
    };

    this.entries.set(input.id, entry);

    return entry;
  }

  async markSnapshotCreated(
    actionId: string,
    snapshotId: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      beforeSnapshotId: snapshotId
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markRunning(
    actionId: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "running",
      startedAt: new Date()
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markCompleted(
    actionId: string,
    result: ActionResult,
    afterHash?: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "completed",
      completedAt: new Date(),
      result,

      ...(afterHash !== undefined
        ? {
            afterHash
          }
        : {})
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markFailed(
    actionId: string,
    error: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "failed",
      completedAt: new Date(),
      result: {
        actionId,
        success: false,
        error
      }
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markUndoing(
    actionId: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "undoing"
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markUndone(
    actionId: string,
    result: UndoResult
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "undone",
      undoResult: result
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async markUndoFailed(
    actionId: string,
    error: string
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status: "undo_failed",
      undoResult: {
        actionId,
        success: false,
        conflict: false,
        error
      }
    };

    this.entries.set(actionId, updated);

    return updated;
  }

  async get(
    actionId: string
  ): Promise<JournalEntry | null> {
    return this.entries.get(actionId) ?? null;
  }

  async list(
    projectId: string
  ): Promise<readonly JournalEntry[]> {
    return [...this.entries.values()]
      .filter(
        (entry) =>
          entry.projectId === projectId
      )
      .sort(
        (a, b) =>
          b.createdAt.getTime() -
          a.createdAt.getTime()
      );
  }

  private require(
    actionId: string
  ): JournalEntry {
    const entry =
      this.entries.get(actionId);

    if (!entry) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action not found: ${actionId}`
      );
    }

    return entry;
  }
}
