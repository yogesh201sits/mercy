import { z } from "zod";

export const actionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "undoing",
  "undone",
  "undo_failed"
]);

export const actionTypeSchema = z.enum([
  "create",
  "update",
  "delete",
  "rename",
  "move",
  "custom"
]);

export const undoStrategySchema = z.enum([
  "restore",
  "reverse",
  "compensate"
]);

export const actionInputSchema = z.object({
  projectId: z.string().min(1),
  type: actionTypeSchema,
  target: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type UndoStrategyType = z.infer<typeof undoStrategySchema>;
export type ActionInputSchema = z.infer<typeof actionInputSchema>;