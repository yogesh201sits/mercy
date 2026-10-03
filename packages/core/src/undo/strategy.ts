import type { Action, UndoResult } from "../actions";
import type { Snapshot } from "../snapshots";

export interface UndoStrategy {
  readonly type: "restore" | "reverse" | "compensate";

  undo(
    action: Action,
    snapshot: Snapshot
  ): Promise<UndoResult>;
}