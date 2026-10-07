import type {
  Action,
  ActionGroup,
  ActionGroupInput,
  ActionInput,
  ActionResult,
  GroupUndoResult,
  UndoResult,
} from "@mercy/core";

import type { MercyRuntime } from "@mercy/runtime";

import type { MercyTransport } from "./transport";

export class LocalRuntimeTransport implements MercyTransport {
  private readonly runtime: MercyRuntime;

  constructor(runtime: MercyRuntime) {
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