import type { ActionInput, ActionResult, UndoResult } from "../actions";

export type ActionGroupStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "undoing"
  | "undone"
  | "undo_failed";

export interface ActionGroup {
  readonly id: string;
  readonly projectId: string;
  readonly status: ActionGroupStatus;
  readonly actionIds: readonly string[];
  readonly createdAt: Date;
  readonly completedAt?: Date;
  readonly error?: string;
}

export interface ActionGroupInput {
  readonly projectId: string;
}

export interface GroupActionResult {
  readonly actionId: string;
  readonly result: ActionResult;
}

export interface GroupUndoResult {
  readonly groupId: string;
  readonly success: boolean;
  readonly conflict: boolean;
  readonly results: readonly UndoResult[];
  readonly error?: string;
}

export interface CreateGroupAction {
  readonly groupId: string;
  readonly input: ActionInput;
}