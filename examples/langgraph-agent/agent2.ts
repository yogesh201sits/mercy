import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { z } from "zod";

import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  join,
  resolve,
  sep,
} from "node:path";

import {
  MercyClient,
  HttpTransport,
  MercyHttpError,
} from "../../packages/sdk/src";

// ============================================================
// Configuration
// ============================================================

const baseUrl =
  process.env.MERCY_API_URL ?? "http://localhost:3000";

const apiKey = process.env.MERCY_API_KEY;
const projectId = process.env.MERCY_TEST_PROJECT_ID;

const filesystemRoot = resolve(
  process.env.MERCY_TEST_FILESYSTEM_ROOT ??
    join(process.cwd(), "apps/api/.test-agent-simulation"),
);

const workspaceRoot = resolve(
  filesystemRoot,
  `langgraph-${crypto.randomUUID()}`,
);

const runId = crypto.randomUUID().slice(0, 8);
const MAX_GRAPH_STEPS = 40;

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not configured.");
}

if (!apiKey || !projectId) {
  throw new Error(
    "Set MERCY_API_KEY and MERCY_TEST_PROJECT_ID in your .env file.",
  );
}

const client = new MercyClient({
  transport: new HttpTransport({
    baseUrl,
    apiKey,
  }),
});

// ============================================================
// Test tracking
// ============================================================

const actionIds: string[] = [];
const groupIds: string[] = [];

let passed = 0;
let failed = 0;

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    failed++;
    throw new Error(`FAIL: ${message}`);
  }

  passed++;
  console.log(`  PASS: ${message}`);
}

function target(name: string): string {
  return `langgraph-${runId}-${name}.txt`;
}

function safePath(name: string): string {
  if (
    !name ||
    name.includes("\\") ||
    name.startsWith("/") ||
    /^[a-zA-Z]:/.test(name)
  ) {
    throw new Error("Expected a safe relative POSIX path.");
  }

  const absolute = resolve(workspaceRoot, name);

  if (
    absolute !== workspaceRoot &&
    !absolute.startsWith(`${workspaceRoot}${sep}`)
  ) {
    throw new Error("Path escapes the isolated test workspace.");
  }

  return absolute;
}

async function exists(name: string): Promise<boolean> {
  try {
    await readFile(safePath(name));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

async function content(name: string): Promise<string> {
  return readFile(safePath(name), "utf8");
}

async function seed(
  name: string,
  value: string,
): Promise<void> {
  const absolute = safePath(name);

  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, value, "utf8");
}

function validateTarget(name: string): void {
  safePath(name);

  if (!name.startsWith(`langgraph-${runId}-`)) {
    throw new Error("Target does not belong to this test run.");
  }
}

// ============================================================
// Mercy SDK helpers
// ============================================================

async function execute(
  type: "create" | "update" | "delete" | "rename" | "move",
  targetPath: string,
  contentValue?: string,
  destination?: string,
) {
  validateTarget(targetPath);

  const metadata: Record<string, unknown> = {};

  if (type === "create" || type === "update") {
    if (contentValue === undefined) {
      throw new Error(`${type} requires content.`);
    }

    metadata.content = contentValue;
  }

  if (type === "rename" || type === "move") {
    if (!destination) {
      throw new Error(`${type} requires a destination.`);
    }

    validateTarget(destination);
    metadata.destination = destination;
  }

  console.log(`\nMercy SDK ${type}: ${targetPath}`);

  if(!projectId)return;

  const result = await client.execute({
    projectId,
    type,
    target: targetPath,
    metadata,
  });

  if (!result.success) {
    throw new Error(`Mercy ${type} failed.`);
  }

  actionIds.push(result.actionId);

  console.log(`  Action ID: ${result.actionId}`);

  return {
    success: result.success,
    actionId: result.actionId,
    operation: type,
    target: targetPath,
    destination,
  };
}

async function undo(actionId: string) {
  if (!actionIds.includes(actionId)) {
    throw new Error("Action ID was not created by this test run.");
  }

  console.log(`\nMercy SDK undo: ${actionId}`);

  const result = await client.undo(actionId);

  return {
    success: result.success,
    conflict: result.conflict,
    actionId,
  };
}

// ============================================================
// LangGraph tools
// ============================================================

const createFile = tool(
  async ({ path, content: value }) =>
    JSON.stringify(await execute("create", path, value)),
  {
    name: "create_file",
    description:
      "Create a file using Mercy SDK. Returns the Mercy action ID.",
    schema: z.object({
      path: z.string(),
      content: z.string(),
    }),
  },
);

const updateFile = tool(
  async ({ path, content: value }) =>
    JSON.stringify(await execute("update", path, value)),
  {
    name: "update_file",
    description:
      "Update an existing file using Mercy SDK. Save the returned action ID to undo the update.",
    schema: z.object({
      path: z.string(),
      content: z.string(),
    }),
  },
);

const deleteFile = tool(
  async ({ path }) =>
    JSON.stringify(await execute("delete", path)),
  {
    name: "delete_file",
    description:
      "Delete a file using Mercy SDK. Save the returned action ID to restore it.",
    schema: z.object({
      path: z.string(),
    }),
  },
);

const renameFile = tool(
  async ({ path, destination }) =>
    JSON.stringify(
      await execute("rename", path, undefined, destination),
    ),
  {
    name: "rename_file",
    description:
      "Rename a file using Mercy SDK. Returns the action ID.",
    schema: z.object({
      path: z.string(),
      destination: z.string(),
    }),
  },
);

const moveFile = tool(
  async ({ path, destination }) =>
    JSON.stringify(
      await execute("move", path, undefined, destination),
    ),
  {
    name: "move_file",
    description:
      "Move a file using Mercy SDK. Returns the action ID.",
    schema: z.object({
      path: z.string(),
      destination: z.string(),
    }),
  },
);

const undoAction = tool(
  async ({ actionId }) =>
    JSON.stringify(await undo(actionId)),
  {
    name: "undo_action",
    description:
      "Undo a Mercy action using its action ID from a previous tool result.",
    schema: z.object({
      actionId: z.string(),
    }),
  },
);

const inspectFile = tool(
  async ({ path }) => {
    validateTarget(path);

    const found = await exists(path);

    return JSON.stringify({
      path,
      exists: found,
      content: found ? await content(path) : null,
    });
  },
  {
    name: "inspect_file",
    description:
      "Inspect a file on disk to verify the actual filesystem state.",
    schema: z.object({
      path: z.string(),
    }),
  },
);

const simulateExternalModification = tool(
  async ({ path, content: value }) => {
    validateTarget(path);

    // Test-only: intentionally bypass Mercy to simulate an external change.
    await seed(path, value);

    return JSON.stringify({
      success: true,
      path,
      note: "External modification simulated.",
    });
  },
  {
    name: "simulate_external_modification",
    description:
      "Test-only tool. Modify a test file outside Mercy to test conflict detection during undo.",
    schema: z.object({
      path: z.string(),
      content: z.string(),
    }),
  },
);

const tools = [
  createFile,
  updateFile,
  deleteFile,
  renameFile,
  moveFile,
  undoAction,
  inspectFile,
  simulateExternalModification,
];

const toolMap = new Map(
  tools.map((item) => [item.name, item]),
);

// ============================================================
// ChatGroq
// ============================================================

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY,
});

const modelWithTools = model.bindTools(tools);

// ============================================================
// LangGraph nodes
// ============================================================

async function agentNode(
  state: typeof MessagesAnnotation.State,
) {
  const response = await modelWithTools.invoke([
    new SystemMessage(
      `
You are a LangGraph agent testing the Mercy SDK.

Project ID: ${projectId}
Test workspace: ${workspaceRoot}

Rules:
1. Use Mercy SDK tools for every normal filesystem mutation.
2. Only use the external modification tool for conflict testing.
3. Use only filenames provided in the task.
4. Record action IDs from actual tool responses.
5. Use undo_action with the correct action ID.
6. Use inspect_file to verify filesystem state.
7. Never claim a scenario passed without evidence.
8. If a tool fails, report the failure honestly.
9. Complete the scenarios in order.
      `.trim(),
    ),
    ...state.messages,
  ]);

  return { messages: [response] };
}

// ============================================================
// Execute tool calls with type-safe dispatch
// ============================================================

async function executeToolCall(
  name: string,
  args: unknown,
): Promise<string> {
  switch (name) {
    case "create_file": {
      const input = z
        .object({
          path: z.string(),
          content: z.string(),
        })
        .parse(args);

      return await createFile.invoke(input);
    }

    case "update_file": {
      const input = z
        .object({
          path: z.string(),
          content: z.string(),
        })
        .parse(args);

      return await updateFile.invoke(input);
    }

    case "delete_file": {
      const input = z
        .object({
          path: z.string(),
        })
        .parse(args);

      return await deleteFile.invoke(input);
    }

    case "rename_file": {
      const input = z
        .object({
          path: z.string(),
          destination: z.string(),
        })
        .parse(args);

      return await renameFile.invoke(input);
    }

    case "move_file": {
      const input = z
        .object({
          path: z.string(),
          destination: z.string(),
        })
        .parse(args);

      return await moveFile.invoke(input);
    }

    case "undo_action": {
      const input = z
        .object({
          actionId: z.string(),
        })
        .parse(args);

      return await undoAction.invoke(input);
    }

    case "inspect_file": {
      const input = z
        .object({
          path: z.string(),
        })
        .parse(args);

      return await inspectFile.invoke(input);
    }

    case "simulate_external_modification": {
      const input = z
        .object({
          path: z.string(),
          content: z.string(),
        })
        .parse(args);

      return await simulateExternalModification.invoke(input);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================
// LangGraph tools node
// ============================================================

async function toolsNode(
  state: typeof MessagesAnnotation.State,
) {
  const last = state.messages[state.messages.length - 1];

  if (!(last instanceof AIMessage) || !last.tool_calls?.length) {
    return { messages: [] };
  }

  const results: ToolMessage[] = [];

  for (const call of last.tool_calls) {
    if (!call.id) {
      throw new Error(`Tool call ${call.name} is missing an ID.`);
    }

    try {
      const result = await executeToolCall(
        call.name,
        call.args,
      );

      results.push(
        new ToolMessage({
          content:
            typeof result === "string"
              ? result
              : JSON.stringify(result),
          tool_call_id: call.id,
        }),
      );
    } catch (error) {
      results.push(
        new ToolMessage({
          content: JSON.stringify({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          }),
          tool_call_id: call.id,
          status: "error",
        }),
      );
    }
  }

  return { messages: results };
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", (state) => {
    const last = state.messages[state.messages.length - 1];

    return last instanceof AIMessage && last.tool_calls?.length
      ? "tools"
      : END;
  })
  .addEdge("tools", "agent")
  .compile();

// ============================================================
// Deterministic verification helpers
// ============================================================

async function verify(
  description: string,
  callback: () => Promise<boolean>,
): Promise<void> {
  try {
    assert(await callback(), description);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("FAIL:")
    ) {
      throw error;
    }

    failed++;
    console.error(`  FAIL: ${description}`, error);
  }
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("\n========================================");
  console.log(" Mercy SDK × LangGraph × ChatGroq");
  console.log("========================================");
  console.log(`API: ${baseUrl}`);
  console.log(`Project: ${projectId}`);
  console.log(`Workspace: ${workspaceRoot}`);

  // The API's FilesystemAdapter must be configured with filesystemRoot.
  // This script creates a unique subdirectory inside that root.
  await rm(workspaceRoot, { recursive: true, force: true });
  await mkdir(workspaceRoot, { recursive: true });

  // Verify connectivity and project access before running the agent.
  if(!projectId)return;
  await client.listActions(projectId);

  const files = {
    create: target("create"),
    update: target("update"),
    delete: target("delete"),
    renameSource: target("rename-source"),
    renameDestination: target("rename-destination"),
    moveSource: target("move-source"),
    moveDestination: target("move-destination"),
    conflict: target("conflict"),
  };

  await seed(files.update, "original content");
  await seed(files.delete, "content to restore");
  await seed(files.renameSource, "rename content");
  await seed(files.moveSource, "move content");
  await seed(files.conflict, "original");

  const task = `
Execute the following scenarios using the tools.

1. CREATE:
Create "${files.create}" with content "created by Mercy".
Inspect and verify the content.

2. UPDATE + UNDO:
Update "${files.update}" to "updated content".
Undo that update using the returned action ID.
Verify the file contains "original content".

3. DELETE + UNDO:
Delete "${files.delete}".
Undo the delete using its action ID.
Verify the file contains "content to restore".

4. RENAME + UNDO:
Rename "${files.renameSource}" to "${files.renameDestination}".
Undo the rename using its action ID.
Verify the source exists and the destination does not.

5. MOVE + UNDO:
Move "${files.moveSource}" to "${files.moveDestination}".
Undo the move using its action ID.
Verify the source exists and the destination does not.

6. EXTERNAL MODIFICATION CONFLICT:
Update "${files.conflict}" to "Mercy-managed content".
Remember the update action ID.
Use simulate_external_modification to change it to "external change".
Attempt to undo the update.
Report whether Mercy rejected the undo as a conflict.
Verify the file still contains "external change".

Perform every operation; do not just explain it.
Use the action ID returned by each corresponding Mercy SDK operation.
Do not invent results.
  `.trim();

  let graphFailed = false;

  try {
    const result = await graph.invoke(
      { messages: [new HumanMessage(task)] },
      { recursionLimit: 40 },
    );

    const last = result.messages[result.messages.length - 1];

    console.log("\n========================================");
    console.log(" Agent report");
    console.log("========================================");

    if (last) {
      console.log(
        typeof last.content === "string"
          ? last.content
          : JSON.stringify(last.content),
      );
    }
  } catch (error) {
    graphFailed = true;
    console.error("\nLangGraph execution failed:", error);
  }

  console.log("\n========================================");
  console.log(" Deterministic verification");
  console.log("========================================");

  await verify(
    "create produces expected content",
    async () =>
      (await exists(files.create)) &&
      (await content(files.create)) === "created by Mercy",
  );

  await verify(
    "update undo restores original content",
    async () => (await content(files.update)) === "original content",
  );

  await verify(
    "delete undo restores original content",
    async () =>
      (await exists(files.delete)) &&
      (await content(files.delete)) === "content to restore",
  );

  await verify(
    "rename undo restores the source",
    async () => await exists(files.renameSource),
  );

  await verify(
    "rename undo removes the destination",
    async () => !(await exists(files.renameDestination)),
  );

  await verify(
    "move undo restores the source",
    async () => await exists(files.moveSource),
  );

  await verify(
    "move undo removes the destination",
    async () => !(await exists(files.moveDestination)),
  );

  await verify(
    "external modification remains intact",
    async () =>
      (await content(files.conflict)) === "external change",
  );

  console.log("\n========================================");
  console.log(" Mercy action journal");
  console.log("========================================");

  for (const actionId of actionIds) {
    try {
      const action = await client.getAction(actionId);

      console.log(
        `${action?.status ?? "unknown"} | ${actionId}`,
      );
    } catch (error) {
      console.error(`Could not retrieve ${actionId}:`, error);
    }
  }

  console.log("\n========================================");
  console.log(" Summary");
  console.log("========================================");
  console.log(`Assertions passed: ${passed}`);
  console.log(`Assertions failed: ${failed}`);
  console.log(`Recorded action IDs: ${actionIds.length}`);
  console.log(`Workspace: ${workspaceRoot}`);

  // Retain files for debugging by default. Set MERCY_CLEANUP=true to remove
  // only the unique workspace created by this run.
  if (process.env.MERCY_CLEANUP === "true") {
    await rm(workspaceRoot, { recursive: true, force: true });
  }

  if (graphFailed || failed > 0) {
    throw new Error("Mercy SDK LangGraph integration tests failed.");
  }
}

// ============================================================
// Run
// ============================================================

main().catch((error: unknown) => {
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
});