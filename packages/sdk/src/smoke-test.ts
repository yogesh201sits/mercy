import {
  HttpTransport,
  MercyClient,
  MercyHttpError,
} from "./index";

const baseUrl = process.env.MERCY_API_URL ?? "http://localhost:3000";
const apiKey = process.env.MERCY_API_KEY;
const projectId = process.env.MERCY_TEST_PROJECT_ID;

if (!apiKey || !projectId) {
  throw new Error(
    "Set MERCY_API_KEY and MERCY_TEST_PROJECT_ID before running.",
  );
}


const client = new MercyClient({
  transport: new HttpTransport({ baseUrl, apiKey }),
});

const target = `sdk-smoke/${crypto.randomUUID()}.txt`;

async function main() {
  console.log("1. Creating filesystem action...");
  if (!projectId) {
    throw new Error(
        "Set MERCY_API_KEY and MERCY_TEST_PROJECT_ID before running.",
    );
  }

  const created = await client.execute({
    projectId,
    type: "create",
    target,
    metadata: {
      content: "Mercy SDK integration verification",
      source: "sdk-smoke",
    },
  });

  if (!created.success) {
    throw new Error(`Action execution failed: ${JSON.stringify(created)}`);
  }

  console.log("   PASS: create", created.actionId);

  console.log("2. Retrieving action...");
  const action = await client.getAction(created.actionId);

  if (!action) {
    throw new Error("Created action was not found.");
  }

  console.log("   PASS: getAction");

  console.log("3. Listing project actions...");
  const actions = await client.listActions(projectId);

  if (!actions.some((item) => item.id === created.actionId)) {
    throw new Error("Created action was not found in the project journal.");
  }

  console.log("   PASS: listActions");

  console.log("4. Undoing action...");
  const undone = await client.undo(created.actionId);

  console.log("   Undo response:", JSON.stringify(undone));

  console.log("5. Confirming action remains retrievable...");
  const afterUndo = await client.getAction(created.actionId);

  if (!afterUndo) {
    throw new Error("Action disappeared from the journal after undo.");
  }

  console.log("   PASS: journal retains action after undo");
  console.log("SDK smoke test completed.");
}

main().catch((error: unknown) => {
  if (error instanceof MercyHttpError) {
    console.error("Mercy API error:", error.status, error.message, error.body);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
