import type {
  ActionInput,
  ActionResult,
  PreparedAction,
  UndoResult,
} from "../actions/contracts";
import type { Action } from "../actions/types";
import type { Snapshot } from "../snapshots/types";

export interface ActionAdapter {
  readonly name: string;

  canHandle(input: ActionInput): boolean;

  prepare(input: ActionInput): Promise<PreparedAction>;

  snapshot(action: PreparedAction): Promise<Snapshot>;

  execute(action: PreparedAction): Promise<ActionResult>;

  undo(
    action: Action,
    snapshot: Snapshot
  ): Promise<UndoResult>;

  verify(action: Action): Promise<VerificationResult>;
}

export interface VerificationResult {
  readonly valid: boolean;
  readonly conflict: boolean;
  readonly reason?: string;
}