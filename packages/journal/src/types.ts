import type {
  Action,
  ActionInput,
  ActionResult,
  ActionStatus,
  UndoResult
} from "@mercy/core";

export interface CreateJournalEntry {
  readonly id: string;
  readonly input: ActionInput;
  readonly undoStrategy: Action["undoStrategy"];
}

export interface JournalEntry extends Action {
  readonly result?: ActionResult;
  readonly undoResult?: UndoResult;
}

export interface ActionJournal {
  create(input: CreateJournalEntry): Promise<JournalEntry>;

  markSnapshotCreated(
    actionId: string,
    snapshotId: string
  ): Promise<JournalEntry>;

  markRunning(actionId: string): Promise<JournalEntry>;

  markCompleted(
    actionId: string,
    result: ActionResult,
    afterHash?: string
  ): Promise<JournalEntry>;

  markFailed(
    actionId: string,
    error: string
  ): Promise<JournalEntry>;

  markUndoing(actionId: string): Promise<JournalEntry>;

  markUndone(
    actionId: string,
    result: UndoResult
  ): Promise<JournalEntry>;

  markUndoFailed(
    actionId: string,
    result: UndoResult
  ): Promise<JournalEntry>;

  get(actionId: string): Promise<JournalEntry | null>;

  list(
    projectId: string
  ): Promise<readonly JournalEntry[]>;
}