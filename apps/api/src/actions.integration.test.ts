import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from "bun:test";

import { Pool } from "pg";

import { createApp } from "./app";
import { createMercyRuntime } from "./runtime";

describe("Mercy API PostgreSQL actions", () => {
    const tableName =
        `mercy_api_users_${crypto
            .randomUUID()
            .replaceAll("-", "_")}`;

    const projectId =
        `api-test-${crypto.randomUUID()}`;

    let clientPool: Pool;
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
        if (!process.env["CLIENT_DATABASE_URL"]) {
            throw new Error(
                "CLIENT_DATABASE_URL must be set",
            );
        }

        clientPool = new Pool({
            connectionString:
                process.env["CLIENT_DATABASE_URL"],
        });

        await clientPool.query(`
            CREATE TABLE "${tableName}" (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL
            )
        `);

        await clientPool.query(`
            INSERT INTO "${tableName}" (
                id,
                name,
                email
            )
            VALUES (
                1,
                'Alice',
                'alice@test.com'
            )
        `);

        const services = createMercyRuntime();

        app = createApp({
            runtime: services.runtime,
        });
    });

    afterAll(async () => {
        await clientPool.query(
            `DROP TABLE IF EXISTS "${tableName}"`,
        );

        await clientPool.end();
    });

    test(
        "updates a PostgreSQL row through the API and undoes it",
        async () => {
            const actionResponse =
                await app.request(
                    `http://localhost/projects/${projectId}/actions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            type: "update",
                            target: tableName,
                            metadata: {
                                primaryKey: "id",
                                primaryKeyValue: 1,
                                changes: {
                                    name: "Alice Updated",
                                },
                            },
                        }),
                    },
                );

            const action =
                await actionResponse.json();

            expect(
                actionResponse.status,
            ).toBe(200);

            expect(
                action.success,
            ).toBe(true);

            expect(
                action.actionId,
            ).toBeDefined();

            const changed =
                await clientPool.query(`
                    SELECT id, name, email
                    FROM "${tableName}"
                    WHERE id = 1
                `);

            expect(changed.rows).toEqual([
                {
                    id: 1,
                    name: "Alice Updated",
                    email: "alice@test.com",
                },
            ]);

            const getResponse =
                await app.request(
                    `http://localhost/actions/${action.actionId}`,
                );

            expect(
                getResponse.status,
            ).toBe(200);

            const storedAction =
                await getResponse.json();

            expect(
                storedAction.id,
            ).toBe(action.actionId);

            expect(
                storedAction.status,
            ).toBe("completed");

            const undoResponse =
                await app.request(
                    `http://localhost/actions/${action.actionId}/undo`,
                    {
                        method: "POST",
                    },
                );

            expect(
                undoResponse.status,
            ).toBe(200);

            const undoResult =
                await undoResponse.json();

            expect(
                undoResult.success,
            ).toBe(true);

            expect(
                undoResult.conflict,
            ).toBe(false);

            const restored =
                await clientPool.query(`
                    SELECT id, name, email
                    FROM "${tableName}"
                    WHERE id = 1
                `);

            expect(restored.rows).toEqual([
                {
                    id: 1,
                    name: "Alice",
                    email: "alice@test.com",
                },
            ]);
        },
        20_000,
    );
});