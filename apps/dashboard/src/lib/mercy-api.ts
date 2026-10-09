import type {
Action,
ActionGroup,
GroupUndoResult,
UndoResult,
} from "@mercy/core";

const API_URL =
process.env.NEXT_PUBLIC_MERCY_API_URL ??
"http://localhost:3000";

export class MercyApiError extends Error {
readonly status: number;

constructor(
message: string,
status: number,
) {
super(message);
this.name = "MercyApiError";
this.status = status;
}
}

export interface Project {
readonly id: string;
readonly name: string;
readonly clerkUserId: string;
readonly createdAt: string;
readonly updatedAt: string;
}

export interface CreateProjectInput {
readonly name: string;
}

interface RequestOptions extends RequestInit {
token?: string | undefined;
}

async function request<T>(
path: string,
init?: RequestOptions,
): Promise<T> {
const token = init?.token;

const headers = new Headers(
init?.headers,
);

headers.set(
"Content-Type",
"application/json",
);

if (token) {
headers.set(
"Authorization",
`Bearer ${token}`,
);
}

const response = await fetch(
`${API_URL}${path}`,
{
...init,
headers,
cache: "no-store",
},
);

if (!response.ok) {
let message =
`Mercy API request failed with status ${response.status}`;


try {
  const body = (await response.json()) as {
    error?: string;
    message?: string;
  };

  message =
    body.error ??
    body.message ??
    message;
} catch {
  // Keep default error message.
}

throw new MercyApiError(
  message,
  response.status,
);


}

return response.json() as Promise<T>;
}

export async function listProjects(
token: string,
): Promise<readonly Project[]> {
return request<readonly Project[]>(
"/projects",
{ token },
);
}

export async function createProject(
input: CreateProjectInput,
token: string,
): Promise<Project> {
return request<Project>(
"/projects",
{
method: "POST",
token,
body: JSON.stringify(input),
},
);
}

export async function getProject(
projectId: string,
token: string,
): Promise<Project> {
return request<Project>(
`/projects/${encodeURIComponent(projectId)}`,
{ token },
);
}

/*

* Dashboard actions
  */

export async function listActions(
projectId: string,
token?: string,
): Promise<readonly Action[]> {
return request<readonly Action[]>(
`/dashboard/projects/${encodeURIComponent(projectId)}/actions`,
{ token },
);
}

export async function getAction(
actionId: string,
token?: string,
): Promise<Action | null> {
return request<Action | null>(
`/dashboard/actions/${encodeURIComponent(actionId)}`,
{ token },
);
}

export async function undoAction(
actionId: string,
token?: string,
): Promise<UndoResult> {
return request<UndoResult>(
`/dashboard/actions/${encodeURIComponent(actionId)}/undo`,
{
method: "POST",
token,
},
);
}

/*

* Dashboard groups
  */

export async function listGroups(
projectId: string,
token?: string,
): Promise<readonly ActionGroup[]> {
return request<readonly ActionGroup[]>(
`/dashboard/projects/${encodeURIComponent(projectId)}/groups`,
{ token },
);
}

export async function getGroup(
groupId: string,
token?: string,
): Promise<ActionGroup> {
return request<ActionGroup>(
`/dashboard/groups/${encodeURIComponent(groupId)}`,
{ token },
);
}

export async function undoGroup(
groupId: string,
token?: string,
): Promise<GroupUndoResult> {
return request<GroupUndoResult>(
`/dashboard/groups/${encodeURIComponent(groupId)}/undo`,
{
method: "POST",
token,
},
);
}

export async function completeGroup(
groupId: string,
token?: string,
): Promise<ActionGroup> {
return request<ActionGroup>(
`/dashboard/groups/${encodeURIComponent(groupId)}/complete`,
{
method: "POST",
token,
},
);
}

export async function health(): Promise<{
readonly status: string;
readonly service: string;
}> {
return request("/health");
}


export interface ApiKey {
readonly id: string;
readonly projectId: string;
readonly name: string;
readonly keyPrefix: string;
readonly createdAt: string;
readonly lastUsedAt?: string | null;
readonly revokedAt?: string | null;
}

export interface CreatedApiKey
extends ApiKey {
readonly secret: string;
}

export interface CreateApiKeyInput {
readonly name: string;
}

export async function listApiKeys(
projectId: string,
token?: string,
): Promise<readonly ApiKey[]> {
return request<readonly ApiKey[]>(
`/dashboard/projects/${encodeURIComponent(projectId)}/api-keys`,
{ token },
);
}

export async function createApiKey(
projectId: string,
input: CreateApiKeyInput,
token?: string,
): Promise<CreatedApiKey> {
return request<CreatedApiKey>(
`/dashboard/projects/${encodeURIComponent(projectId)}/api-keys`,
{
method: "POST",
token,
body: JSON.stringify(input),
},
);
}

export async function revokeApiKey(
projectId: string,
keyId: string,
token?: string,
): Promise<ApiKey> {
return request<ApiKey>(
`/dashboard/projects/${encodeURIComponent(projectId)}/api-keys/${encodeURIComponent(keyId)}/revoke`,
{
method: "POST",
token,
},
);
}
