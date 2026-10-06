export type RecoveryStatus =
  | "recovered"
  | "requires_review"
  | "skipped";

export interface RecoveryResult {
  readonly actionId: string;
  readonly status: RecoveryStatus;
  readonly reason?: string;
}
