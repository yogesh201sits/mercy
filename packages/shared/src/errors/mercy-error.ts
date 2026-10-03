export type MercyErrorCode =
  | "INVALID_INPUT"
  | "ACTION_NOT_FOUND"
  | "SNAPSHOT_NOT_FOUND"
  | "ADAPTER_NOT_FOUND"
  | "ACTION_CONFLICT"
  | "UNDO_FAILED"
  | "ACTION_FAILED"
  | "SNAPSHOT_FAILED"
  | "INTERNAL_ERROR";

export class MercyError extends Error {
  readonly code: MercyErrorCode;
  readonly cause?: unknown;

  constructor(
    code: MercyErrorCode,
    message: string,
    options?: {
      cause?: unknown;
    }
  ) {
    super(message);

    this.name = "MercyError";
    this.code = code;
    this.cause = options?.cause;
  }
}