-- CreateTable
CREATE TABLE "action_groups" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "action_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_group_actions" (
    "group_id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "action_group_actions_pkey" PRIMARY KEY ("group_id","action_id")
);

-- CreateIndex
CREATE INDEX "action_groups_project_id_idx" ON "action_groups"("project_id");

-- CreateIndex
CREATE INDEX "action_groups_project_id_created_at_idx" ON "action_groups"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "action_groups_status_idx" ON "action_groups"("status");

-- CreateIndex
CREATE INDEX "action_group_actions_action_id_idx" ON "action_group_actions"("action_id");

-- CreateIndex
CREATE UNIQUE INDEX "action_group_actions_group_id_position_key" ON "action_group_actions"("group_id", "position");

-- AddForeignKey
ALTER TABLE "action_group_actions" ADD CONSTRAINT "action_group_actions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "action_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_group_actions" ADD CONSTRAINT "action_group_actions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
