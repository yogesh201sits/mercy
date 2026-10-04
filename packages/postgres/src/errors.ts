import { MercyError } from "@mercy/shared";

export function mapPrismaError(
  error: unknown,
  resource: "action" | "snapshot",
): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  ) {
    if (resource === "action") {
      throw new MercyError("ACTION_NOT_FOUND", "Action not found");
    }

    throw new MercyError("SNAPSHOT_NOT_FOUND", "Snapshot not found");
  }

  throw error;
}

export async function mapPrismaOperation<T>(
  operation: () => Promise<T>,
  resource: "action" | "snapshot",
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    mapPrismaError(error, resource);
  }
}
