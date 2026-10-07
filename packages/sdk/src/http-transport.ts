import type {
    Action,
    ActionGroup,
    ActionGroupInput,
    ActionInput,
    ActionResult,
    GroupUndoResult,
    UndoResult,
} from "@mercy/core";

import { request } from "./http";
import type { MercyTransport } from "./transport";

export interface HttpTransportOptions {
    readonly baseUrl: string;
}

export class HttpTransport implements MercyTransport {
    private readonly baseUrl: string;

    constructor(options: HttpTransportOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    }

    async execute(
        input: ActionInput,
        groupId?: string,
    ): Promise<ActionResult> {
        return request<ActionResult>(
            this.baseUrl,
            `/projects/${encodeURIComponent(input.projectId)}/actions`,
            {
                method: "POST",
                body: JSON.stringify({
                    ...input,
                    ...(groupId ? { groupId } : {}),
                }),
            },
        );
    }

    async undo(
        actionId: string,
    ): Promise<UndoResult> {
        return request<UndoResult>(
            this.baseUrl,
            `/actions/${encodeURIComponent(actionId)}/undo`,
            {
                method: "POST",
            },
        );
    }

    async getAction(
        actionId: string,
    ): Promise<Action | null> {
        return request<Action | null>(
            this.baseUrl,
            `/actions/${encodeURIComponent(actionId)}`,
            {
                method: "GET",
            },
        );
    }

    async listActions(
        projectId: string,
    ): Promise<readonly Action[]> {
        return request<readonly Action[]>(
            this.baseUrl,
            `/projects/${encodeURIComponent(projectId)}/actions`,
            {
                method: "GET",
            },
        );
    }

    async startGroup(
        input: ActionGroupInput,
    ): Promise<ActionGroup> {
        return request<ActionGroup>(
            this.baseUrl,
            `/projects/${encodeURIComponent(input.projectId)}/groups`,
            {
                method: "POST",
                body: JSON.stringify(input),
            },
        );
    }

    async completeGroup(
        groupId: string,
    ): Promise<ActionGroup> {
        return request<ActionGroup>(
            this.baseUrl,
            `/groups/${encodeURIComponent(groupId)}/complete`,
            {
                method: "POST",
            },
        );
    }

    async undoGroup(
        groupId: string,
    ): Promise<GroupUndoResult> {
        return request<GroupUndoResult>(
            this.baseUrl,
            `/groups/${encodeURIComponent(groupId)}/undo`,
            {
                method: "POST",
            },
        );
    }

    async getGroup(
        groupId: string,
    ): Promise<ActionGroup> {
        return request<ActionGroup>(
            this.baseUrl,
            `/groups/${encodeURIComponent(groupId)}`,
            {
                method: "GET",
            },
        );
    }

    async listGroups(
        projectId: string,
    ): Promise<readonly ActionGroup[]> {
        return request<readonly ActionGroup[]>(
            this.baseUrl,
            `/projects/${encodeURIComponent(projectId)}/groups`,
            {
                method: "GET",
            },
        );
    }
}