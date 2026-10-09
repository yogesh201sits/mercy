import {
  mkdir,
  readFile,
  rm,
  writeFile,
  access,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  HttpTransport,
  MercyClient,
  MercyHttpError,
} from "./index";

const baseUrl =
  process.env.MERCY_API_URL ?? "http://localhost:3000";

const apiKey = process.env.MERCY_API_KEY;
const projectId = process.env.MERCY_TEST_PROJECT_ID;

// This must match the filesystem root configured by the running API.
const filesystemRoot = resolve(
  process.env.MERCY_TEST_FILESYSTEM_ROOT ??
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../../apps/api/.test-agent-simulation",
    ),
);

if (!apiKey || !projectId) {
  throw new Error(
    "Set MERCY_API_KEY and MERCY_TEST_PROJECT_ID before running.",
  );
}

const client = new MercyClient({
  transport: new HttpTransport({ baseUrl, apiKey }),
});

const runId = crypto.randomUUID().slice(0, 8);
const createdTargets: string[] = [];

let passed = 0;

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }

  passed++;
  console.log(`   PASS: ${message}`);
}

function target(name: string): string {
  const value = `sdk-integration-${runId}-${name}.txt`;
  createdTargets.push(value);
  return value;
}

function filePath(name: string): string {
  return join(filesystemRoot, name);
}

async function exists(name: string): Promise<boolean> {
  try {
    await access(filePath(name));
    return true;
  } catch {
    return false;
  }
}

async function content(name: string): Promise<string> {
  return readFile(filePath(name), "utf8");
}

async function seed(name: string, value: string): Promise<void> {
  await mkdir(filesystemRoot, { recursive: true });
  await writeFile(filePath(name), value, "utf8");
}

async function expectHttpStatus(
  status: number,
  operation: () => Promise<unknown>,
  label: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    check(
      error instanceof MercyHttpError && error.status === status,
      `${label} returns HTTP ${status}`,
    );
    return;
  }

  throw new Error(`FAIL: ${label} unexpectedly succeeded`);
}

async function main(): Promise<void> {
  await mkdir(filesystemRoot, { recursive: true });

  console.log("\n=== 1. CREATE + JOURNAL + SNAPSHOT ===");

  const createTarget = target("create");

  if(!projectId)return;

  const created = await client.execute({
    projectId,
    type: "create",
    target: createTarget,
    metadata: { content: "Mercy SDK integration test" },
  });

  check(created.success, "create action succeeds");
  check(await exists(createTarget), "created file exists");
  check(
    (await content(createTarget)) === "Mercy SDK integration test",
    "created file contains expected content",
  );

  const createdAction = await client.getAction(created.actionId);

  check(createdAction !== null, "created action is retrievable");
  check(
    createdAction.status === "completed",
    "created action is marked completed",
  );
  check(
    Boolean(createdAction.beforeSnapshotId),
    "create action records a before-snapshot reference",
  );
  check(
    Boolean(createdAction.afterHash),
    "create action records an after-hash",
  );

  const listedActions = await client.listActions(projectId);

  check(
    listedActions.some((action) => action.id === created.actionId),
    "created action appears in project action list",
  );

  console.log("\n=== 2. UPDATE + RESTORE ===");

  const updateTarget = target("update");
  await seed(updateTarget, "original content");

  const updated = await client.execute({
    projectId,
    type: "update",
    target: updateTarget,
    metadata: { content: "updated content" },
  });

  check(updated.success, "update action succeeds");
  check(
    (await content(updateTarget)) === "updated content",
    "update changes file content",
  );

  const updateAction = await client.getAction(updated.actionId);

  check(
    Boolean(updateAction?.beforeSnapshotId),
    "update records a before-snapshot reference",
  );

  const updateUndo = await client.undo(updated.actionId);

  check(updateUndo.success, "update undo succeeds");
  check(!updateUndo.conflict, "update undo has no conflict");
  check(
    (await content(updateTarget)) === "original content",
    "update undo restores original content",
  );

  const restoredUpdate = await client.getAction(updated.actionId);

  check(
    restoredUpdate?.status === "undone",
    "updated action is marked undone",
  );

  console.log("\n=== 3. DELETE + RESTORE ===");

  const deleteTarget = target("delete");
  await seed(deleteTarget, "content to restore");

  const deleted = await client.execute({
    projectId,
    type: "delete",
    target: deleteTarget,
  });

  check(deleted.success, "delete action succeeds");
  check(!(await exists(deleteTarget)), "delete removes the file");

  const deleteUndo = await client.undo(deleted.actionId);

  check(deleteUndo.success, "delete undo succeeds");
  check(await exists(deleteTarget), "delete undo restores the file");
  check(
    (await content(deleteTarget)) === "content to restore",
    "delete undo restores original content",
  );

  console.log("\n=== 4. RENAME + REVERSE ===");

  const renameSource = target("rename-source");
  const renameDestination = target("rename-destination");

  await seed(renameSource, "rename content");

  const renamed = await client.execute({
    projectId,
    type: "rename",
    target: renameSource,
    metadata: { destination: renameDestination },
  });

  check(renamed.success, "rename action succeeds");
  check(!(await exists(renameSource)), "rename removes source path");
  check(await exists(renameDestination), "rename creates destination path");
  check(
    (await content(renameDestination)) === "rename content",
    "rename preserves file content",
  );

  const renameUndo = await client.undo(renamed.actionId);

  check(renameUndo.success, "rename undo succeeds");
  check(await exists(renameSource), "rename undo restores source path");
  check(
    !(await exists(renameDestination)),
    "rename undo removes destination path",
  );

  console.log("\n=== 5. MOVE + REVERSE ===");

  const moveSource = target("move-source");
  const moveDestination = target("move-destination");

  await seed(moveSource, "move content");

  const moved = await client.execute({
    projectId,
    type: "move",
    target: moveSource,
    metadata: { destination: moveDestination },
  });

  check(moved.success, "move action succeeds");
  check(!(await exists(moveSource)), "move removes source path");
  check(await exists(moveDestination), "move creates destination path");
  check(
    (await content(moveDestination)) === "move content",
    "move preserves file content",
  );

  const moveUndo = await client.undo(moved.actionId);

  check(moveUndo.success, "move undo succeeds");
  check(await exists(moveSource), "move undo restores source path");
  check(
    !(await exists(moveDestination)),
    "move undo removes destination path",
  );

    console.log("\n=== 6. EXTERNAL MODIFICATION CONFLICT ===");

        const conflictTarget = target("conflict");
        await seed(conflictTarget, "original");

        const conflictAction = await client.execute({
        projectId,
        type: "update",
        target: conflictTarget,
        metadata: {
            content: "Mercy-managed content",
        },
        });

        check(conflictAction.success, "conflict test update succeeds");

        await writeFile(
        filePath(conflictTarget),
        "externally modified content",
        "utf8",
        );

        let conflictUndo;

        try {
        conflictUndo = await client.undo(conflictAction.actionId);
        } catch (error) {
        if (
            error instanceof MercyHttpError &&
            error.status === 409 &&
            typeof error.body === "object" &&
            error.body !== null &&
            "conflict" in error.body &&
            error.body.conflict === true
        ) {
            conflictUndo = error.body as {
            actionId: string;
            success: boolean;
            conflict: boolean;
            error?: string;
            };
        } else {
            throw error;
        }
        }

        check(!conflictUndo.success, "conflicting undo is rejected");
        check(conflictUndo.conflict, "undo reports a conflict");
        check(
        (await content(conflictTarget)) === "externally modified content",
        "external modification is preserved",
    );

  console.log("\n=== 7. ACTION GROUP LIFECYCLE ===");

  const group = await client.startGroup({ projectId });

  check(Boolean(group.id), "group is created with an ID");
  check(group.projectId === projectId, "group belongs to the requested project");

  const groupTargetA = target("group-a");
  const groupTargetB = target("group-b");

  const groupActionA = await client.execute(
    {
      projectId,
      type: "create",
      target: groupTargetA,
      metadata: { content: "group file A" },
    },
    group.id,
  );

  check(groupActionA.success, "first group action succeeds");
  check(await exists(groupTargetA), "first group file exists");

  const groupActionB = await client.execute(
    {
      projectId,
      type: "create",
      target: groupTargetB,
      metadata: { content: "group file B" },
    },
    group.id,
  );

  check(groupActionB.success, "second group action succeeds");
  check(await exists(groupTargetB), "second group file exists");

  const completedGroup = await client.completeGroup(group.id);

  check(
    completedGroup.status === "completed",
    "group transitions to completed",
  );

  check(
    completedGroup.actionIds.includes(groupActionA.actionId),
    "group records its first action",
  );
  check(
    completedGroup.actionIds.includes(groupActionB.actionId),
    "group records its second action",
  );

  const retrievedGroup = await client.getGroup(group.id);

  check(retrievedGroup.id === group.id, "group is retrievable");

  const listedGroups = await client.listGroups(projectId);

  check(
    listedGroups.some((item) => item.id === group.id),
    "group appears in project group list",
  );

  console.log("\n=== 8. GROUP UNDO ===");

  const groupUndo = await client.undoGroup(group.id);

  check(groupUndo.success, "group undo succeeds");
  check(!groupUndo.conflict, "group undo has no conflict");
  check(
    groupUndo.results.length === 2,
    "group undo returns a result for each action",
  );
  check(
    groupUndo.results.every((result) => result.success),
    "all group action undos succeed",
  );
  check(!(await exists(groupTargetA)), "group undo removes first created file");
  check(!(await exists(groupTargetB)), "group undo removes second created file");

  const undoneGroup = await client.getGroup(group.id);

  check(
    undoneGroup.status === "undone",
    "group transitions to undone",
  );

  console.log("\n=== 9. INVALID API KEY ===");

  const invalidKeyClient = new MercyClient({
    transport: new HttpTransport({
      baseUrl,
      apiKey: "sk_mercy_invalid_integration_test_key",
    }),
  });

  await expectHttpStatus(
    401,
    () => invalidKeyClient.listActions(projectId),
    "invalid API key",
  );

  console.log("\n=== 10. CROSS-PROJECT ACCESS ===");

  await expectHttpStatus(
    403,
    () => client.listActions(crypto.randomUUID()),
    "cross-project action listing",
  );

  console.log(`\nSDK integration checks passed: ${passed}`);
  console.log("Note: custom actions are not supported by FilesystemAdapter.");
}

main()
  .catch((error: unknown) => {
    if (error instanceof MercyHttpError) {
      console.error(
        "Mercy API error:",
        error.status,
        error.message,
        error.body,
      );
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    // Clean up only this run's isolated test files.
    // Preserve the external-modification file for inspection if its undo
    // conflict behavior needs debugging.
    for (const name of createdTargets) {
      if (name.includes("-conflict.txt")) {
        continue;
      }

      await rm(filePath(name), { force: true }).catch(() => {});
    }
  });