import type {
  ActionGroup,
  ActionGroupInput,
  GroupActionResult,
  GroupUndoResult
} from "@mercy/core";

export interface ActionGroupJournal {
  create(
    input: ActionGroupInput & {
      readonly id: string;
    }
  ): Promise<ActionGroup>;

  addAction(
    groupId: string,
    actionId: string
  ): Promise<ActionGroup>;

  markRunning(
    groupId: string
  ): Promise<ActionGroup>;

  markCompleted(
    groupId: string
  ): Promise<ActionGroup>;

  markFailed(
    groupId: string,
    error: string
  ): Promise<ActionGroup>;

  markUndoing(
    groupId: string
  ): Promise<ActionGroup>;

  markUndone(
    groupId: string,
    result: GroupUndoResult
  ): Promise<ActionGroup>;

  markUndoFailed(
    groupId: string,
    result: GroupUndoResult
  ): Promise<ActionGroup>;

  get(
    groupId: string
  ): Promise<ActionGroup | null>;

  list(
    projectId: string
  ): Promise<readonly ActionGroup[]>;
}