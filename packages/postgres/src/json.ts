import type { Prisma } from "../generated/prisma/client";

export function toPrismaJson(
  value: Readonly<Record<string, unknown>>,
): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}