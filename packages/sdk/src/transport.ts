import type {
  Action,
  ActionGroup,
  ActionGroupInput,
  ActionInput,
  ActionResult,
  GroupUndoResult,
  UndoResult,
} from "@mercy/core";

export interface MercyTransport {
  execute(
    input: ActionInput,
    groupId?: string,
  ): Promise<ActionResult>;

  undo(
    actionId: string,
  ): Promise<UndoResult>;

  getAction(
    actionId: string,
  ): Promise<Action | null>;

  listActions(
    projectId: string,
  ): Promise<readonly Action[]>;

  startGroup(
    input: ActionGroupInput,
  ): Promise<ActionGroup>;

  completeGroup(
    groupId: string,
  ): Promise<ActionGroup>;

  undoGroup(
    groupId: string,
  ): Promise<GroupUndoResult>;

  getGroup(
    groupId: string,
  ): Promise<ActionGroup>;

  listGroups(
    projectId: string,
  ): Promise<readonly ActionGroup[]>;
}