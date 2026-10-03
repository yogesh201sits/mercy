import type { ActionStatus } from "@mercy/core";
import type {
  ActionJournal,
  CreateJournalEntry,
  JournalEntry
} from "./types";
import { MercyError } from "@mercy/shared";
import type { ActionResult } from "@mercy/core";

export class InMemoryActionJournal implements ActionJournal {
  private readonly entries = new Map<string, JournalEntry>();

  async create(input: CreateJournalEntry): Promise<JournalEntry> {
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
      undoStrategy: input.undoStrategy
    };

    this.entries.set(input.id, entry);

    return entry;
  }

  async markRunning(actionId: string): Promise<JournalEntry> {
    return this.updateStatus(actionId, "running");
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
        ...(afterHash !== undefined ? { afterHash } : {})
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

  async markUndoing(actionId: string): Promise<JournalEntry> {
    return this.updateStatus(actionId, "undoing");
  }

  async markUndone(
    actionId: string,
    result: NonNullable<JournalEntry["undoResult"]>
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

  async get(actionId: string): Promise<JournalEntry | null> {
    return this.entries.get(actionId) ?? null;
  }

  async list(projectId: string): Promise<readonly JournalEntry[]> {
    return [...this.entries.values()].filter(
      (entry) => entry.projectId === projectId
    );
  }

  private require(actionId: string): JournalEntry {
    const entry = this.entries.get(actionId);

    if (!entry) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action not found: ${actionId}`
      );
    }

    return entry;
  }

  private async updateStatus(
    actionId: string,
    status: ActionStatus
  ): Promise<JournalEntry> {
    const entry = this.require(actionId);

    const updated: JournalEntry = {
      ...entry,
      status
    };

    this.entries.set(actionId, updated);

    return updated;
  }
}