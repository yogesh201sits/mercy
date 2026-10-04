import type {
  Action,
  ActionInput,
  ActionResult,
  PreparedAction,
  UndoResult
} from "../actions";
import type {
  CapturedState,
  Snapshot
} from "../snapshots";

export interface ActionAdapter {
  readonly name: string;

  canHandle(
    input: ActionInput
  ): boolean;

  prepare(
    input: ActionInput
  ): Promise<PreparedAction>;

  snapshot(
    action: PreparedAction
  ): Promise<CapturedState>;

  execute(
    action: PreparedAction
  ): Promise<ActionResult>;

  undo(
    action: Action,
    snapshot: Snapshot,
    data: Uint8Array
  ): Promise<UndoResult>;

  verify(
    action: Action
  ): Promise<VerificationResult>;
}

export interface VerificationResult {
  readonly valid: boolean;
  readonly conflict: boolean;
  readonly reason?: string;
}