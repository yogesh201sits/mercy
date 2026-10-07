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

export interface MercyClientOptions {
  readonly transport: MercyTransport;
}

export class MercyClient {
  private readonly transport: MercyTransport;

  constructor(options: MercyClientOptions) {
    this.transport = options.transport;
  }

  execute(
    input: ActionInput,
    groupId?: string,
  ): Promise<ActionResult> {
    return this.transport.execute(input, groupId);
  }

  undo(
    actionId: string,
  ): Promise<UndoResult> {
    return this.transport.undo(actionId);
  }

  getAction(
    actionId: string,
  ): Promise<Action | null> {
    return this.transport.getAction(actionId);
  }

  listActions(
    projectId: string,
  ): Promise<readonly Action[]> {
    return this.transport.listActions(projectId);
  }

  startGroup(
    input: ActionGroupInput,
  ): Promise<ActionGroup> {
    return this.transport.startGroup(input);
  }

  completeGroup(
    groupId: string,
  ): Promise<ActionGroup> {
    return this.transport.completeGroup(groupId);
  }

  undoGroup(
    groupId: string,
  ): Promise<GroupUndoResult> {
    return this.transport.undoGroup(groupId);
  }

  getGroup(
    groupId: string,
  ): Promise<ActionGroup> {
    return this.transport.getGroup(groupId);
  }

  listGroups(
    projectId: string,
  ): Promise<readonly ActionGroup[]> {
    return this.transport.listGroups(projectId);
  }
}