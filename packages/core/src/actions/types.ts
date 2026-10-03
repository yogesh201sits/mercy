export type ActionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "undoing"
  | "undone"
  | "undo_failed";

export type ActionType =
  | "create"
  | "update"
  | "delete"
  | "rename"
  | "move"
  | "custom";

export interface Action {
  readonly id: string;
  readonly projectId: string;
  readonly type: ActionType;
  readonly target: string;
  readonly status: ActionStatus;

  readonly createdAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;

  readonly beforeSnapshotId?: string;
  readonly afterHash?: string;

  readonly undoStrategy: UndoStrategyType;
}

export type UndoStrategyType =
  | "restore"
  | "reverse"
  | "compensate";