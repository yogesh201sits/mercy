import "dotenv/config";

import { ChatGroq } from "@langchain/groq";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

import { tool } from "@langchain/core/tools";

import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from "@langchain/langgraph";

import { z } from "zod";

import {
  mkdir,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import { join } from "node:path";

import type {
  ActionInput,
} from "../../packages/core/src";

import {
  InMemoryActionGroupJournal,
} from "../../packages/journal/src";

import {
  LocalSnapshotStorage,
} from "../../packages/snapshots/src";

import {
  createPrismaClient,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../../packages/postgres/src";

import {
  FilesystemAdapter,
} from "../../packages/filesystem/src";

import {
  MercyRuntime,
} from "../../packages/runtime/src/runtime";

// ============================================================
// Configuration
// ============================================================

const projectId =
  `langgraph-demo-${crypto.randomUUID()}`;

const workspaceRoot =
  join(
    process.cwd(),
    ".mercy-demo",
    projectId,
  );

const snapshotRoot =
  join(
    process.cwd(),
    ".mercy-demo-snapshots",
    projectId,
  );

// ============================================================
// Mercy Runtime
// ============================================================

function createMercy() {
  const prisma =
    createPrismaClient();

  const actionJournal =
    new PostgresActionJournal(
      prisma,
    );

  const groupJournal =
    new InMemoryActionGroupJournal();

  const snapshotStorage =
    new LocalSnapshotStorage(
      snapshotRoot,
    );

  const snapshots =
    new PostgresSnapshotStore(
      prisma,
      snapshotStorage,
    );

  const adapter =
    new FilesystemAdapter(
      workspaceRoot,
    );

  const runtime =
    new MercyRuntime({
      journal: actionJournal,

      groupJournal,

      snapshots,

      adapters: [
        adapter,
      ],
    });

  return {
    runtime,
    actionJournal,
    snapshots,
    prisma,
  };
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("");
  console.log(
    "==============================================",
  );
  console.log(
    " Mercy × LangGraph × ChatGroq",
  );
  console.log(
    "==============================================",
  );
  console.log("");

  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured",
    );
  }

  // ----------------------------------------------------------
  // Clean workspace
  // ----------------------------------------------------------

  await rm(
    workspaceRoot,
    {
      recursive: true,
      force: true,
    },
  );

  await mkdir(
    workspaceRoot,
    {
      recursive: true,
    },
  );

  // ----------------------------------------------------------
  // Create demo directory
  // ----------------------------------------------------------

  const demoRoot =
    join(
      workspaceRoot,
      "demo",
    );

  await mkdir(
    demoRoot,
    {
      recursive: true,
    },
  );

  // ----------------------------------------------------------
  // Create Mercy runtime
  // ----------------------------------------------------------

  const {
    runtime,
    actionJournal,
    prisma,
  } = createMercy();

  const actionIds: string[] = [];

  // ==========================================================
  // CREATE FILE
  // ==========================================================

  const createFile =
    tool(
      async ({
        path,
        content,
      }) => {
        const action: ActionInput = {
          projectId,

          type: "create",

          target: path,

          metadata: {
            actionId:
              crypto.randomUUID(),

            content,
          },
        };

        console.log("");
        console.log(
          `🔧 Mercy create_file: ${path}`,
        );

        const result =
          await runtime.execute(
            action,
          );

        if (!result.success) {
          throw new Error(
            `Mercy create failed for ${path}`,
          );
        }

        actionIds.push(
          result.actionId,
        );

        console.log(
          `   ✓ action ${result.actionId}`,
        );

        return JSON.stringify({
          success: true,
          actionId:
            result.actionId,
          operation:
            "create",
          path,
        });
      },
      {
        name: "create_file",

        description:
          "Create a new file inside the workspace. Always use this tool when creating a file.",

        schema: z.object({
          path: z
            .string()
            .describe(
              "Relative file path such as demo/hello.txt",
            ),

          content: z
            .string()
            .describe(
              "Complete content of the file",
            ),
        }),
      },
    );

  // ==========================================================
  // UPDATE FILE
  // ==========================================================

  const updateFile =
    tool(
      async ({
        path,
        content,
      }) => {
        const action: ActionInput = {
          projectId,

          type: "update",

          target: path,

          metadata: {
            actionId:
              crypto.randomUUID(),

            content,
          },
        };

        console.log("");
        console.log(
          `🔧 Mercy update_file: ${path}`,
        );

        const result =
          await runtime.execute(
            action,
          );

        if (!result.success) {
          throw new Error(
            `Mercy update failed for ${path}`,
          );
        }

        actionIds.push(
          result.actionId,
        );

        console.log(
          `   ✓ action ${result.actionId}`,
        );

        return JSON.stringify({
          success: true,
          actionId:
            result.actionId,
          operation:
            "update",
          path,
        });
      },
      {
        name: "update_file",

        description:
          "Update an existing file. Mercy snapshots the previous state so the update can be undone.",

        schema: z.object({
          path: z
            .string()
            .describe(
              "Relative file path",
            ),

          content: z
            .string()
            .describe(
              "Complete new content",
            ),
        }),
      },
    );

  // ==========================================================
  // DELETE FILE
  // ==========================================================

  const deleteFile =
    tool(
      async ({
        path,
      }) => {
        const action: ActionInput = {
          projectId,

          type: "delete",

          target: path,

          metadata: {
            actionId:
              crypto.randomUUID(),
          },
        };

        console.log("");
        console.log(
          `🔧 Mercy delete_file: ${path}`,
        );

        const result =
          await runtime.execute(
            action,
          );

        if (!result.success) {
          throw new Error(
            `Mercy delete failed for ${path}`,
          );
        }

        actionIds.push(
          result.actionId,
        );

        console.log(
          `   ✓ action ${result.actionId}`,
        );

        return JSON.stringify({
          success: true,
          actionId:
            result.actionId,
          operation:
            "delete",
          path,
        });
      },
      {
        name: "delete_file",

        description:
          "Delete an existing file. Mercy snapshots it before deletion so the action can be undone.",

        schema: z.object({
          path: z
            .string()
            .describe(
              "Relative file path",
            ),
        }),
      },
    );

  // ==========================================================
  // UNDO ACTION
  // ==========================================================

  const undoAction =
    tool(
      async ({
        actionId,
      }) => {
        console.log("");
        console.log(
          `↩️ Mercy undo: ${actionId}`,
        );

        const result =
          await runtime.undo(
            actionId,
          );

        if (!result.success) {
          throw new Error(
            `Mercy undo failed for ${actionId}`,
          );
        }

        console.log(
          "   ✓ undo completed",
        );

        return JSON.stringify({
          success: true,
          actionId,
          operation:
            "undo",
          conflict:
            result.conflict,
        });
      },
      {
        name: "undo_action",

        description:
          "Undo a previous Mercy action using its action ID.",

        schema: z.object({
          actionId: z
            .string()
            .describe(
              "Mercy action ID returned by a previous filesystem operation",
            ),
        }),
      },
    );

  // ==========================================================
  // ChatGroq tools
  // ==========================================================

  const tools = [
    createFile,
    updateFile,
    deleteFile,
    undoAction,
  ];

  const model =
    new ChatGroq({
      model:
        "openai/gpt-oss-120b",

      temperature: 0,

      apiKey:
        process.env.GROQ_API_KEY,
    });

  const modelWithTools =
    model.bindTools(
      tools,
    );

  // ==========================================================
  // Execute tool call
  //
  // IMPORTANT:
  // We intentionally use a switch instead of a Map.
  //
  // A Map containing differently typed StructuredTools causes
  // TypeScript to infer a union of incompatible invoke()
  // signatures.
  // ==========================================================

  async function executeToolCall(
    call: {
      name: string;
      args: unknown;
      id?: string;
    },
  ): Promise<string> {
    if (!call.id) {
      throw new Error(
        `Tool call ${call.name} is missing an ID`,
      );
    }

    switch (call.name) {
      case "create_file": {
        const args =
          z
            .object({
              path: z.string(),
              content: z.string(),
            })
            .parse(
              call.args,
            );

        return await createFile.invoke(
          args,
        );
      }

      case "update_file": {
        const args =
          z
            .object({
              path: z.string(),
              content: z.string(),
            })
            .parse(
              call.args,
            );

        return await updateFile.invoke(
          args,
        );
      }

      case "delete_file": {
        const args =
          z
            .object({
              path: z.string(),
            })
            .parse(
              call.args,
            );

        return await deleteFile.invoke(
          args,
        );
      }

      case "undo_action": {
        const args =
          z
            .object({
              actionId: z.string(),
            })
            .parse(
              call.args,
            );

        return await undoAction.invoke(
          args,
        );
      }

      default:
        throw new Error(
          `Unknown tool: ${call.name}`,
        );
    }
  }

  // ==========================================================
  // LangGraph
  // ==========================================================

  const graph =
    new StateGraph(
      MessagesAnnotation,
    )

      // ------------------------------------------------------
      // Agent
      // ------------------------------------------------------

      .addNode(
        "agent",
        async (
          state,
        ) => {
          const response =
            await modelWithTools.invoke(
              [
                new SystemMessage(
                  `
You are a filesystem agent operating through Mercy.

You have access to Mercy-backed filesystem tools.

IMPORTANT RULES:

1. Never directly manipulate the filesystem.
2. Always use the provided Mercy tools for filesystem mutations.
3. Never claim an operation succeeded unless the tool returned success.
4. Keep track of action IDs returned by Mercy.
5. When asked to undo an action, use undo_action.
6. Work only inside the demo directory.
7. Complete the user's requested operations.
8. Do not merely explain what you would do.
9. Actually call the tools.
                  `.trim(),
                ),

                ...state.messages,
              ],
            );

          return {
            messages: [
              response,
            ],
          };
        },
      )

      // ------------------------------------------------------
      // Tools
      // ------------------------------------------------------

      .addNode(
        "tools",
        async (
          state,
        ) => {
          const lastMessage =
            state.messages[
              state.messages.length - 1
            ];

          if (!lastMessage) {
            return {
              messages: [],
            };
          }

          if (
            !(lastMessage instanceof AIMessage)
          ) {
            return {
              messages: [],
            };
          }

          if (
            lastMessage!.tool_calls!.length ===
            0
          ) {
            return {
              messages: [],
            };
          }

          const messages: ToolMessage[] =
            [];

          for (
            const call of
              lastMessage!.tool_calls!
          ) {
            const result =
              await executeToolCall(
                {
                  name:
                    call.name,

                  args:
                    call.args,

                  id:
                    call.id!,
                },
              );

            if (!call.id) {
              throw new Error(
                `Tool call ${call.name} is missing an ID`,
              );
            }

            messages.push(
              new ToolMessage({
                content:
                  result,

                tool_call_id:
                  call.id,
              }),
            );
          }

          return {
            messages,
          };
        },
      )

      // ------------------------------------------------------
      // START → Agent
      // ------------------------------------------------------

      .addEdge(
        START,
        "agent",
      )

      // ------------------------------------------------------
      // Agent → Tools OR END
      // ------------------------------------------------------

      .addConditionalEdges(
        "agent",
        (
          state,
        ) => {
          const lastMessage =
            state.messages[
              state.messages.length - 1
            ];

          if (!lastMessage) {
            return END;
          }

          if (
            lastMessage instanceof AIMessage &&
            lastMessage!.tool_calls!.length > 0
          ) {
            return "tools";
          }

          return END;
        },
      )

      // ------------------------------------------------------
      // Tools → Agent
      // ------------------------------------------------------

      .addEdge(
        "tools",
        "agent",
      )

      .compile();

  // ==========================================================
  // Run real agent
  // ==========================================================

  console.log(
    "🤖 Starting real ChatGroq agent...",
  );

  console.log(
    `📁 Workspace: ${workspaceRoot}`,
  );

  console.log(
    `📁 Agent directory: ${demoRoot}`,
  );

  console.log("");

  await graph.invoke({
    messages: [
      new HumanMessage(
        `
Work inside the demo directory.

Perform these filesystem operations:

1. Create demo/hello.txt with exactly:
Hello from LangGraph

2. Create demo/config.json containing:
{
  "framework": "langgraph",
  "protectedBy": "mercy"
}

3. Update demo/hello.txt so it contains exactly:
Hello from LangGraph + Mercy

4. Delete demo/config.json.

5. Undo the deletion of demo/config.json.

6. Update demo/hello.txt so it contains exactly:
Final content protected by Mercy

7. Undo the latest update to hello.txt.

Use the Mercy tools for every filesystem mutation.

Actually perform the operations.
Do not just describe what you would do.
        `.trim(),
      ),
    ],
  });

  // ==========================================================
  // Final filesystem state
  // ==========================================================

  console.log("");
  console.log(
    "==============================================",
  );
  console.log(
    " Final filesystem state",
  );
  console.log(
    "==============================================",
  );

  const entries =
    await readdir(
      demoRoot,
      {
        withFileTypes: true,
      },
    );

  if (
    entries.length === 0
  ) {
    console.log(
      "(demo is empty)",
    );
  }

  for (
    const entry of entries
  ) {
    console.log(
      `📄 demo/${entry.name}`,
    );
  }

  // ==========================================================
  // hello.txt
  // ==========================================================

  const helloPath =
    join(
      demoRoot,
      "hello.txt",
    );

  if (
    await Bun.file(
      helloPath,
    ).exists()
  ) {
    console.log("");
    console.log(
      "hello.txt:",
    );

    console.log(
      await readFile(
        helloPath,
        "utf8",
      ),
    );
  }

  // ==========================================================
  // config.json
  // ==========================================================

  const configPath =
    join(
      demoRoot,
      "config.json",
    );

  if (
    await Bun.file(
      configPath,
    ).exists()
  ) {
    console.log("");
    console.log(
      "config.json:",
    );

    console.log(
      await readFile(
        configPath,
        "utf8",
      ),
    );
  }

  // ==========================================================
  // Mercy journal
  // ==========================================================

  console.log("");
  console.log(
    "==============================================",
  );
  console.log(
    " Mercy actions",
  );
  console.log(
    "==============================================",
  );

  for (
    const actionId of actionIds
  ) {
    const action =
      await actionJournal.get(
        actionId,
      );

    console.log(
      `${action?.type ?? "unknown"} → ${actionId}`,
    );
  }

  console.log("");
  console.log(
    `✓ ${actionIds.length} Mercy actions recorded`,
  );

  console.log(
    "✓ PostgreSQL journal used",
  );

  console.log(
    "✓ Snapshot storage used",
  );

  console.log(
    `✓ Workspace: ${workspaceRoot}`,
  );

  console.log("");

  await prisma.$disconnect();
}

// ============================================================
// Execute
// ============================================================

main().catch(
  (error) => {
    console.error("");
    console.error(
      "❌ Agent failed",
    );
    console.error(error);

    process.exit(1);
  },
);
