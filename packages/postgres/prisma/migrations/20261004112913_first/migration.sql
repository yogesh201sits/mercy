-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "undo_strategy" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "before_snapshot_id" TEXT,
    "after_hash" TEXT,
    "metadata" JSONB,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_snapshots" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actions_project_id_idx" ON "actions"("project_id");

-- CreateIndex
CREATE INDEX "actions_project_id_created_at_idx" ON "actions"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "actions_status_idx" ON "actions"("status");

-- CreateIndex
CREATE INDEX "action_snapshots_action_id_idx" ON "action_snapshots"("action_id");

-- AddForeignKey
ALTER TABLE "action_snapshots" ADD CONSTRAINT "action_snapshots_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
