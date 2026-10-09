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
  readonly apiKey: string;
}

export class HttpTransport implements MercyTransport {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: HttpTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
  }

  private request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    return request<T>(this.baseUrl, path, {
      ...options,
      apiKey: this.apiKey,
    });
  }

  execute(
    input: ActionInput,
    groupId?: string,
  ): Promise<ActionResult> {
    return this.request(
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

  undo(actionId: string): Promise<UndoResult> {
    return this.request(
      `/actions/${encodeURIComponent(actionId)}/undo`,
      { method: "POST" },
    );
  }

  getAction(actionId: string): Promise<Action | null> {
    return this.request(
      `/actions/${encodeURIComponent(actionId)}`,
    );
  }

  listActions(projectId: string): Promise<readonly Action[]> {
    return this.request(
      `/projects/${encodeURIComponent(projectId)}/actions`,
    );
  }

  startGroup(input: ActionGroupInput): Promise<ActionGroup> {
    return this.request(
      `/projects/${encodeURIComponent(input.projectId)}/groups`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  }

  completeGroup(groupId: string): Promise<ActionGroup> {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}/complete`,
      { method: "POST" },
    );
  }

  undoGroup(groupId: string): Promise<GroupUndoResult> {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}/undo`,
      { method: "POST" },
    );
  }

  getGroup(groupId: string): Promise<ActionGroup> {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}`,
    );
  }

  listGroups(projectId: string): Promise<readonly ActionGroup[]> {
    return this.request(
      `/projects/${encodeURIComponent(projectId)}/groups`,
    );
  }
}