import { MercyHttpError } from "./error";

export interface RequestOptions extends RequestInit {
  apiKey?: string;
}

export async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { apiKey, headers: suppliedHeaders, ...init } = options;

  const headers = new Headers(suppliedHeaders);
  headers.set("Content-Type", "application/json");

  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, "")}${path}`,
    {
      ...init,
      headers,
    },
  );

  const contentType = response.headers.get("content-type");

  const body = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Mercy API request failed with status ${response.status}`;

    throw new MercyHttpError(
      response.status,
      message,
      body,
    );
  }

  return body as T;
}