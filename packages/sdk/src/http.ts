import { MercyHttpError } from "./error";

export async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${baseUrl}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  );

  const contentType = response.headers.get(
    "content-type",
  );

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