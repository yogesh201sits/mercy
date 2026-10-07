import type {
  Action,
  ActionGroup,
  ActionGroupInput,
  ActionInput,
  ActionResult,
  GroupUndoResult,
  UndoResult,
} from "@mercy/core";

import type { MercyTransport } from "./transport";

export interface MercyRuntimeLike {
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

export class LocalRuntimeTransport implements MercyTransport {
  private readonly runtime: MercyRuntimeLike;

  constructor(runtime: MercyRuntimeLike) {
    this.runtime = runtime;
  }

  execute(
    input: ActionInput,
    groupId?: string,
  ): Promise<ActionResult> {
    return this.runtime.execute(input, groupId);
  }

  undo(
    actionId: string,
  ): Promise<UndoResult> {
    return this.runtime.undo(actionId);
  }

  getAction(
    actionId: string,
  ): Promise<Action | null> {
    return this.runtime.getAction(actionId);
  }

  listActions(
    projectId: string,
  ): Promise<readonly Action[]> {
    return this.runtime.listActions(projectId);
  }

  startGroup(
    input: ActionGroupInput,
  ): Promise<ActionGroup> {
    return this.runtime.startGroup(input);
  }

  completeGroup(
    groupId: string,
  ): Promise<ActionGroup> {
    return this.runtime.completeGroup(groupId);
  }

  undoGroup(
    groupId: string,
  ): Promise<GroupUndoResult> {
    return this.runtime.undoGroup(groupId);
  }

  getGroup(
    groupId: string,
  ): Promise<ActionGroup> {
    return this.runtime.getGroup(groupId);
  }

  listGroups(
    projectId: string,
  ): Promise<readonly ActionGroup[]> {
    return this.runtime.listGroups(projectId);
  }
}