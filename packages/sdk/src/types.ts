import type {
  Action,
  ActionGroup,
  ActionInput,
  ActionResult,
  GroupUndoResult,
  UndoResult
} from "@mercy/core";

import type { MercyRuntime } from "@mercy/runtime";

import type { MercyTransport } from "./transport";

export interface MercyClientOptions {
  readonly runtime: MercyRuntime;
}

export interface MercyClient {
  execute(
    input: ActionInput,
    groupId?: string
  ): Promise<ActionResult>;

  undo(
    actionId: string
  ): Promise<UndoResult>;

  getAction(
    actionId: string
  ): Promise<Action | null>;

  listActions(
    projectId: string
  ): Promise<readonly Action[]>;

  startGroup(
    input: {
      readonly projectId: string;
    }
  ): Promise<ActionGroup>;

  completeGroup(
    groupId: string
  ): Promise<ActionGroup>;

  undoGroup(
    groupId: string
  ): Promise<GroupUndoResult>;

  getGroup(
    groupId: string
  ): Promise<ActionGroup>;

  listGroups(
    projectId: string
  ): Promise<readonly ActionGroup[]>;
}

export interface MercyClientConfig {
  readonly transport: MercyTransport;
}