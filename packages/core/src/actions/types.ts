import type {
  actionStatusSchema,
  actionTypeSchema,
  undoStrategySchema
} from "@mercy/shared";

export type ActionStatus = ReturnType<
  typeof actionStatusSchema.parse
>;

export type ActionType = ReturnType<
  typeof actionTypeSchema.parse
>;

export type UndoStrategyType = ReturnType<
  typeof undoStrategySchema.parse
>;

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