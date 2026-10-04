-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "result" JSONB,
ADD COLUMN     "undo_result" JSONB;
