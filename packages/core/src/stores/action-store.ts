import type { Action, ActionInput} from "../actions";

export interface ActionStore {
  create(input: CreateActionInput): Promise<Action>;

  get(actionId: string): Promise<Action | null>;

  update(
    actionId: string,
    update: ActionUpdate
  ): Promise<Action>;

  list(projectId: string): Promise<readonly Action[]>;
}

export interface CreateActionInput extends ActionInput {
  readonly id: string;
  readonly undoStrategy: Action["undoStrategy"];
}

export interface ActionUpdate {
  readonly status?: Action["status"];
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly beforeSnapshotId?: string;
  readonly afterHash?: string;
}