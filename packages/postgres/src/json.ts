import type { Prisma } from "../generated/prisma/client";

export function toPrismaJson(
  value: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value)
  ) as Prisma.InputJsonValue;
}