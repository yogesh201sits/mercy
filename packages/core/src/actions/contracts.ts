import type { ActionType, UndoStrategyType } from "./types";

export interface ActionInput {
  readonly projectId: string;
  readonly type: ActionType;
  readonly target: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ActionResult {
  readonly actionId: string;
  readonly success: boolean;
  readonly result?: unknown;
  readonly error?: string;
}

export interface UndoResult {
  readonly actionId: string;
  readonly success: boolean;
  readonly conflict: boolean;
  readonly error?: string;
}

export interface PreparedAction {
  readonly actionId: string;
  readonly input: ActionInput;
  readonly undoStrategy: UndoStrategyType;
  readonly metadata?: Readonly<Record<string, unknown>>;
}