import type {
  Action,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "@mercy/core";

export interface CustomAdapterHandlers {
  readonly canHandle: (
    input: ActionInput,
  ) => boolean;

  readonly prepare: (
    input: ActionInput,
  ) => Promise<PreparedAction>;

  readonly snapshot: (
    action: PreparedAction,
  ) => Promise<CapturedState>;

  readonly execute: (
    action: PreparedAction,
  ) => Promise<ActionResult>;

  readonly undo: (
    action: Action,
    snapshot: Snapshot,
    data: Uint8Array,
  ) => Promise<UndoResult>;

  readonly verify: (
    action: Action,
  ) => Promise<VerificationResult>;
}

export interface CustomAdapterOptions {
  readonly name: string;
  readonly handlers: CustomAdapterHandlers;
}