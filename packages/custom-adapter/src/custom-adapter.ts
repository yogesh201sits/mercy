import type {
  Action,
  ActionAdapter,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "@mercy/core";

import type {
  CustomAdapterOptions,
} from "./types";

export class CustomAdapter
  implements ActionAdapter
{
  readonly name: string;

  private readonly handlers: CustomAdapterOptions["handlers"];

  constructor(
    options: CustomAdapterOptions,
  ) {
    this.name = options.name;
    this.handlers = options.handlers;
  }

  canHandle(
    input: ActionInput,
  ): boolean {
    return this.handlers.canHandle(input);
  }

  prepare(
    input: ActionInput,
  ): Promise<PreparedAction> {
    return this.handlers.prepare(input);
  }

  snapshot(
    action: PreparedAction,
  ): Promise<CapturedState> {
    return this.handlers.snapshot(action);
  }

  execute(
    action: PreparedAction,
  ): Promise<ActionResult> {
    return this.handlers.execute(action);
  }

  undo(
    action: Action,
    snapshot: Snapshot,
    data: Uint8Array,
  ): Promise<UndoResult> {
    return this.handlers.undo(
      action,
      snapshot,
      data,
    );
  }

  verify(
    action: Action,
  ): Promise<VerificationResult> {
    return this.handlers.verify(action);
  }
}