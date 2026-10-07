import {
    afterEach,
    describe,
    expect,
    mock,
    test,
} from "bun:test";

import {
    HttpTransport,
    MercyHttpError,
} from "./index";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

function mockFetch(
    body: unknown,
    status = 200,
) {
    const mockedFetch = mock(
        async () =>
            new Response(
                JSON.stringify(body),
                {
                    status,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            ),
    );

    globalThis.fetch =
        mockedFetch as unknown as typeof fetch;

    return mockedFetch;
}

describe("@mercy/sdk HttpTransport", () => {
    test("execute sends POST request", async () => {
        const fetchMock = mockFetch({
            actionId: "action-1",
            success: true,
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000/",
        });

        const result = await transport.execute({
            projectId: "project-1",
            type: "custom",
            target: "test-tool",
        });

        expect(result).toEqual({
            actionId: "action-1",
            success: true,
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/projects/project-1/actions",
        );

        expect(options.method).toBe("POST");

        expect(
            JSON.parse(options.body as string),
        ).toEqual({
            projectId: "project-1",
            type: "custom",
            target: "test-tool",
        });
    });

    test("execute sends groupId when provided", async () => {
        const fetchMock = mockFetch({
            actionId: "action-1",
            success: true,
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        await transport.execute(
            {
                projectId: "project-1",
                type: "custom",
                target: "test-tool",
            },
            "group-1",
        );

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(
            JSON.parse(options.body as string),
        ).toEqual({
            projectId: "project-1",
            type: "custom",
            target: "test-tool",
            groupId: "group-1",
        });
    });

    test("undo sends POST request", async () => {
        const fetchMock = mockFetch({
            actionId: "action-1",
            success: true,
            conflict: false,
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.undo("action-1");

        expect(result.success).toBe(true);

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/actions/action-1/undo",
        );

        expect(options.method).toBe("POST");
    });

    test("getAction sends GET request", async () => {
        const fetchMock = mockFetch({
            id: "action-1",
            projectId: "project-1",
            type: "custom",
            target: "test-tool",
            status: "completed",
            undoStrategy: "compensate",
            createdAt: "2026-10-07T10:00:00.000Z",
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.getAction(
            "action-1",
        );

        expect(result?.id).toBe("action-1");

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/actions/action-1",
        );

        expect(options.method).toBe("GET");
    });

    test("listActions sends GET request", async () => {
        const fetchMock = mockFetch([]);

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.listActions(
            "project-1",
        );

        expect(result).toEqual([]);

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/projects/project-1/actions",
        );

        expect(options.method).toBe("GET");
    });

    test("startGroup sends POST request", async () => {
        const fetchMock = mockFetch({
            id: "group-1",
            projectId: "project-1",
            status: "pending",
            actionIds: [],
            createdAt: "2026-10-07T10:00:00.000Z",
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.startGroup({
            projectId: "project-1",
        });

        expect(result.id).toBe("group-1");

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/projects/project-1/groups",
        );

        expect(options.method).toBe("POST");

        expect(
            JSON.parse(options.body as string),
        ).toEqual({
            projectId: "project-1",
        });
    });

    test("completeGroup sends POST request", async () => {
        const fetchMock = mockFetch({
            id: "group-1",
            projectId: "project-1",
            status: "completed",
            actionIds: ["action-1"],
            createdAt: "2026-10-07T10:00:00.000Z",
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.completeGroup(
            "group-1",
        );

        expect(result.status).toBe("completed");

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];
        expect(url).toBe(
            "http://localhost:3000/groups/group-1/complete",
        );

        expect(options.method).toBe("POST");
    });

    test("undoGroup sends POST request", async () => {
        const fetchMock = mockFetch({
            groupId: "group-1",
            success: true,
            conflict: false,
            results: [],
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.undoGroup(
            "group-1",
        );

        expect(result.success).toBe(true);

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/groups/group-1/undo",
        );

        expect(options.method).toBe("POST");
    });

    test("getGroup sends GET request", async () => {
        const fetchMock = mockFetch({
            id: "group-1",
            projectId: "project-1",
            status: "completed",
            actionIds: ["action-1"],
            createdAt: "2026-10-07T10:00:00.000Z",
        });

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.getGroup(
            "group-1",
        );

        expect(result.id).toBe("group-1");

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/groups/group-1",
        );

        expect(options.method).toBe("GET");
    });

    test("listGroups sends GET request", async () => {
        const fetchMock = mockFetch([]);

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        const result = await transport.listGroups(
            "project-1",
        );

        expect(result).toEqual([]);

        const call = fetchMock.mock.calls[0];

        expect(call).toBeDefined();

        const [url, options] = call as unknown as [
            string,
            RequestInit,
        ];

        expect(url).toBe(
            "http://localhost:3000/projects/project-1/groups",
        );

        expect(options.method).toBe("GET");
    });

    test("throws MercyHttpError for failed requests", async () => {
        const fetchMock = mockFetch(
            {
                message: "Action not found",
            },
            404,
        );

        const transport = new HttpTransport({
            baseUrl: "http://localhost:3000",
        });

        await expect(
            transport.undo("missing-action"),
        ).rejects.toBeInstanceOf(MercyHttpError);

        expect(fetchMock).toHaveBeenCalledTimes(1);

        try {
            await transport.undo("missing-action");
        } catch (error) {
            expect(error).toBeInstanceOf(MercyHttpError);

            const httpError = error as MercyHttpError;

            expect(httpError.status).toBe(404);
            expect(httpError.message).toBe(
                "Action not found",
            );
            expect(httpError.body).toEqual({
                message: "Action not found",
            });
        }
    });
});