import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import {
  createHash,
} from "node:crypto";

import type {
  Action,
  ActionInput,
  ActionResult,
  CapturedState,
  PreparedAction,
  Snapshot,
  UndoResult,
  VerificationResult,
} from "../packages/core/src";

import {
  InMemoryActionGroupJournal,
} from "../packages/journal/src";

import {
  LocalSnapshotStorage,
} from "../packages/snapshots/src";

import {
  createPrismaClient,
  PostgresActionJournal,
  PostgresSnapshotStore,
} from "../packages/postgres/src";

import {
  CustomAdapter,
} from "../packages/custom-adapter/src";

import {
  MercyRuntime,
} from "../packages/runtime/src/runtime";

const projectId =
  `custom-adapter-${crypto.randomUUID()}`;

const snapshotRoot =
  `${process.cwd()}/.test-custom-adapter-snapshots/${crypto.randomUUID()}`;

const prisma =
  createPrismaClient();

interface CustomToolState {
  readonly value: string;
}

let toolState: CustomToolState = {
  value: "initial",
};

function hashState(
  state: CustomToolState,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify(state),
    )
    .digest("hex");
}

function createCustomAdapter() {
  return new CustomAdapter({
    name: "custom-test-tool",

    handlers: {
      canHandle(
        input: ActionInput,
      ): boolean {
        return (
          input.type === "custom" &&
          input.target === "test.custom-tool"
        );
      },

      async prepare(
        input: ActionInput,
      ): Promise<PreparedAction> {
        const actionId =
          typeof input.metadata?.["actionId"] === "string"
            ? input.metadata["actionId"]
            : crypto.randomUUID();

        return {
          actionId,

          input,

          undoStrategy: "compensate",

          ...(input.metadata
            ? {
                metadata:
                  input.metadata,
              }
            : {}),
        };
      },

      async snapshot(
        _action: PreparedAction,
      ): Promise<CapturedState> {
        return {
          data: new TextEncoder().encode(
            JSON.stringify(toolState),
          ),
        };
      },

      async execute(
        action: PreparedAction,
      ): Promise<ActionResult> {
        const value =
          action.input.metadata?.["value"];

        if (typeof value !== "string") {
          return {
            actionId: action.actionId,
            success: false,
            error:
              "Custom tool requires metadata.value",
          };
        }

        toolState = {
          value,
        };

        return {
          actionId: action.actionId,
          success: true,
          result: {
            value,
          },
          afterHash:
            hashState(toolState),
        };
      },

      async undo(
        action: Action,
        _snapshot: Snapshot,
        data: Uint8Array,
      ): Promise<UndoResult> {
        const currentHash =
          hashState(toolState);

        if (
          action.afterHash &&
          currentHash !== action.afterHash
        ) {
          return {
            actionId: action.id,
            success: false,
            conflict: true,
            error:
              "Custom tool state has changed since the action completed",
          };
        }

        const previousState =
          JSON.parse(
            new TextDecoder().decode(data),
          ) as CustomToolState;

        toolState = previousState;

        return {
          actionId: action.id,
          success: true,
          conflict: false,
        };
      },

      async verify(
        action: Action,
      ): Promise<VerificationResult> {
        if (!action.afterHash) {
          return {
            valid: false,
            conflict: false,
            reason:
              "Action does not contain an afterHash",
          };
        }

        const currentHash =
          hashState(toolState);

        if (
          currentHash !== action.afterHash
        ) {
          return {
            valid: false,
            conflict: true,
            reason:
              "Custom tool state has changed since the action completed",
          };
        }

        return {
          valid: true,
          conflict: false,
        };
      },
    },
  });
}

function createRuntime() {
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

  const customAdapter =
    createCustomAdapter();

  const runtime =
    new MercyRuntime({
      journal: actionJournal,
      groupJournal,
      snapshots,
      adapters: [
        customAdapter,
      ],
    });

  return {
    runtime,
    actionJournal,
    snapshots,
    snapshotStorage,
    customAdapter,
  };
}

describe(
  "CustomAdapter integration",
  () => {
    let runtime: MercyRuntime;

    let actionJournal:
      PostgresActionJournal;

    let snapshots:
      PostgresSnapshotStore;

    beforeEach(() => {
      toolState = {
        value: "initial",
      };

      const created =
        createRuntime();

      runtime =
        created.runtime;

      actionJournal =
        created.actionJournal;

      snapshots =
        created.snapshots;
    });

    afterAll(
      async () => {
        await prisma.$disconnect();
      },
    );

    test(
      "executes a custom action and restores it through Mercy undo",
      async () => {
        const action: ActionInput = {
          projectId,

          type: "custom",

          target:
            "test.custom-tool",

          metadata: {
            actionId:
              crypto.randomUUID(),

            value:
              "updated",
          },
        };

        const result =
          await runtime.execute(
            action,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          result.afterHash,
        ).toBeDefined();

        expect(
          toolState,
        ).toEqual({
          value: "updated",
        });

        const storedAction =
          await actionJournal.get(
            result.actionId,
          );

        expect(
          storedAction,
        ).not.toBeNull();

        expect(
          storedAction?.beforeSnapshotId,
        ).toBeDefined();

        const snapshotData =
          await snapshots.read(
            storedAction!
              .beforeSnapshotId!,
          );

        expect(
          JSON.parse(
            new TextDecoder().decode(
              snapshotData,
            ),
          ),
        ).toEqual({
          value: "initial",
        });

        const undo =
          await runtime.undo(
            result.actionId,
          );

        expect(
          undo.success,
        ).toBe(true);

        expect(
          undo.conflict,
        ).toBe(false);

        expect(
          toolState,
        ).toEqual({
          value: "initial",
        });
      },
      45_000,
    );

    test(
      "detects a conflict before undoing a custom action",
      async () => {
        const action: ActionInput = {
          projectId,

          type: "custom",

          target:
            "test.custom-tool",

          metadata: {
            actionId:
              crypto.randomUUID(),

            value:
              "updated",
          },
        };

        const result =
          await runtime.execute(
            action,
          );

        expect(
          result.success,
        ).toBe(true);

        expect(
          toolState,
        ).toEqual({
          value: "updated",
        });

        // External application modifies
        // the custom resource.
        toolState = {
          value: "external-change",
        };

        const undo =
          await runtime.undo(
            result.actionId,
          );

        expect(
          undo.success,
        ).toBe(false);

        expect(
          undo.conflict,
        ).toBe(true);

        expect(
          undo.error,
        ).toBe(
          "Custom tool state has changed since the action completed",
        );

        // Mercy must not overwrite
        // the external modification.
        expect(
          toolState,
        ).toEqual({
          value: "external-change",
        });
      },
      45_000,
    );
  },
);