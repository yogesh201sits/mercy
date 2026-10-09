// import {
//   afterAll,
//   beforeAll,
//   describe,
//   expect,
//   test,
// } from "bun:test";

// import { Pool } from "pg";

// import {
//   createApp,
// } from "./app";

// import {
//   createMercyRuntime,
// } from "./runtime";

// describe("Mercy API PostgreSQL groups", () => {
//   const tableName =
//     `mercy_api_group_users_${crypto
//       .randomUUID()
//       .replaceAll("-", "_")}`;

//   const projectId =
//     `api-group-test-${crypto.randomUUID()}`;

//   let clientPool: Pool;
//   let app: ReturnType<typeof createApp>;

//   beforeAll(async () => {
//     if (!process.env["CLIENT_DATABASE_URL"]) {
//       throw new Error(
//         "CLIENT_DATABASE_URL must be set",
//       );
//     }

//     clientPool = new Pool({
//       connectionString:
//         process.env["CLIENT_DATABASE_URL"],
//     });

//     await clientPool.query(`
//       CREATE TABLE "${tableName}" (
//         id INTEGER PRIMARY KEY,
//         name TEXT NOT NULL,
//         email TEXT NOT NULL
//       )
//     `);

//     await clientPool.query(`
//       INSERT INTO "${tableName}" (
//         id,
//         name,
//         email
//       )
//       VALUES
//         (1, 'Alice', 'alice@test.com'),
//         (2, 'Bob', 'bob@test.com'),
//         (3, 'Charlie', 'charlie@test.com')
//     `);

//     const services =
//       createMercyRuntime();

//     const app =
//       createApp({
//         runtime: services.runtime,
//         projects: services.projects,
//       });
//   });

//   afterAll(async () => {
//     await clientPool.query(
//       `DROP TABLE IF EXISTS "${tableName}"`,
//     );

//     await clientPool.end();
//   });

//   test(
//     "executes and undoes PostgreSQL actions as a group",
//     async () => {
//       // Create group
//       const groupResponse =
//         await app.request(
//           `http://localhost/projects/${projectId}/groups`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({}),
//           },
//         );

//       expect(groupResponse.status).toBe(201);

//       const group =
//         await groupResponse.json();

//       expect(group.id).toBeDefined();
//       expect(group.projectId).toBe(projectId);
//       expect(group.status).toBe("pending");

//       const groupId = group.id as string;

//       // Update Alice
//       const aliceResponse =
//         await app.request(
//           `http://localhost/projects/${projectId}/actions`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               type: "update",
//               target: tableName,
//               groupId,
//               metadata: {
//                 primaryKey: "id",
//                 primaryKeyValue: 1,
//                 changes: {
//                   name: "Alice Updated",
//                 },
//               },
//             }),
//           },
//         );

//       expect(aliceResponse.status).toBe(200);

//       const aliceAction =
//         await aliceResponse.json();

//       expect(aliceAction.success).toBe(true);

//       // Delete Bob
//       const bobResponse =
//         await app.request(
//           `http://localhost/projects/${projectId}/actions`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               type: "delete",
//               target: tableName,
//               groupId,
//               metadata: {
//                 primaryKey: "id",
//                 primaryKeyValue: 2,
//               },
//             }),
//           },
//         );

//       expect(bobResponse.status).toBe(200);

//       const bobAction =
//         await bobResponse.json();

//       expect(bobAction.success).toBe(true);

//       // Update Charlie
//       const charlieResponse =
//         await app.request(
//           `http://localhost/projects/${projectId}/actions`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               type: "update",
//               target: tableName,
//               groupId,
//               metadata: {
//                 primaryKey: "id",
//                 primaryKeyValue: 3,
//                 changes: {
//                   name: "Charlie Updated",
//                 },
//               },
//             }),
//           },
//         );

//       expect(charlieResponse.status).toBe(200);

//       const charlieAction =
//         await charlieResponse.json();

//       expect(charlieAction.success).toBe(true);

//       // Verify modified database state
//       const modified =
//         await clientPool.query(`
//           SELECT id, name, email
//           FROM "${tableName}"
//           ORDER BY id
//         `);

//       expect(modified.rows).toEqual([
//         {
//           id: 1,
//           name: "Alice Updated",
//           email: "alice@test.com",
//         },
//         {
//           id: 3,
//           name: "Charlie Updated",
//           email: "charlie@test.com",
//         },
//       ]);

//       // Complete group
//       const completeResponse =
//         await app.request(
//           `http://localhost/groups/${groupId}/complete`,
//           {
//             method: "POST",
//           },
//         );

//       expect(
//         completeResponse.status,
//       ).toBe(200);

//       const completedGroup =
//         await completeResponse.json();

//       expect(
//         completedGroup.status,
//       ).toBe("completed");

//       expect(
//         completedGroup.actionIds,
//       ).toHaveLength(3);

//       // Undo group
//       const undoResponse =
//         await app.request(
//           `http://localhost/groups/${groupId}/undo`,
//           {
//             method: "POST",
//           },
//         );

//       expect(
//         undoResponse.status,
//       ).toBe(200);

//       const undoResult =
//         await undoResponse.json();

//       expect(
//         undoResult.success,
//       ).toBe(true);

//       expect(
//         undoResult.conflict,
//       ).toBe(false);

//       expect(
//         undoResult.results,
//       ).toHaveLength(3);

//       // Verify complete restoration
//       const restored =
//         await clientPool.query(`
//           SELECT id, name, email
//           FROM "${tableName}"
//           ORDER BY id
//         `);

//       expect(restored.rows).toEqual([
//         {
//           id: 1,
//           name: "Alice",
//           email: "alice@test.com",
//         },
//         {
//           id: 2,
//           name: "Bob",
//           email: "bob@test.com",
//         },
//         {
//           id: 3,
//           name: "Charlie",
//           email: "charlie@test.com",
//         },
//       ]);

//       // Verify final group state
//       const groupResult =
//         await app.request(
//           `http://localhost/groups/${groupId}`,
//         );

//       expect(
//         groupResult.status,
//       ).toBe(200);

//       const finalGroup =
//         await groupResult.json();

//       expect(
//         finalGroup.status,
//       ).toBe("undone");
//     },
//     60_000,
//   );
// });