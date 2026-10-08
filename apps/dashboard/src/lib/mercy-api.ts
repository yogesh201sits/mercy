import type {
  Action,
  ActionGroup,
  ActionResult,
  GroupUndoResult,
  UndoResult,
} from "@mercy/core";

const API_URL =
  process.env.NEXT_PUBLIC_MERCY_API_URL ?? "http://localhost:3000";

export class MercyApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MercyApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });


  if (!response.ok) {
    let message = `Mercy API request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: string;
        message?: string;
      };

      message = body.error ?? body.message ?? message;
    } catch {
      // Keep the default error message.
    }

    throw new MercyApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function listActions(
  projectId: string,
): Promise<readonly Action[]> {
  return request<readonly Action[]>(
    `/projects/${encodeURIComponent(projectId)}/actions`,
  );
}

export async function getAction(
  actionId: string,
): Promise<Action | null> {
  return request<Action | null>(
    `/actions/${encodeURIComponent(actionId)}`,
  );
}

export async function undoAction(
  actionId: string,
): Promise<UndoResult> {
  return request<UndoResult>(
    `/actions/${encodeURIComponent(actionId)}/undo`,
    {
      method: "POST",
    },
  );
}

export async function listGroups(
  projectId: string,
): Promise<readonly ActionGroup[]> {
  return request<readonly ActionGroup[]>(
    `/projects/${encodeURIComponent(projectId)}/groups`,
  );
}

export async function getGroup(
  groupId: string,
): Promise<ActionGroup> {
  return request<ActionGroup>(
    `/groups/${encodeURIComponent(groupId)}`,
  );
}

export async function undoGroup(
  groupId: string,
): Promise<GroupUndoResult> {
  return request<GroupUndoResult>(
    `/groups/${encodeURIComponent(groupId)}/undo`,
    {
      method: "POST",
    },
  );
}

export async function completeGroup(
  groupId: string,
): Promise<ActionGroup> {
  return request<ActionGroup>(
    `/groups/${encodeURIComponent(groupId)}/complete`,
    {
      method: "POST",
    },
  );
}

export async function health(): Promise<{
  readonly status: string;
  readonly service: string;
}> {
  return request("/health");
}