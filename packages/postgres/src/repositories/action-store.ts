import type {
    Action,
    ActionInput
} from "@mercy/core";
import { MercyError } from "@mercy/shared";

import type {
    PrismaClient
} from "../../generated/prisma/client";

import { toPrismaJson } from "../json";

export class PostgresActionStore {
    constructor(
        private readonly prisma: PrismaClient
    ) { }

    async create(input: {
        readonly id: string;
        readonly input: ActionInput;
        readonly undoStrategy: Action["undoStrategy"];
    }): Promise<Action> {
        const action =
            await this.prisma.action.create({
                data: {
                    id: input.id,
                    projectId: input.input.projectId,
                    type: input.input.type,
                    target: input.input.target,
                    status: "pending",
                    undoStrategy: input.undoStrategy,
                    ...(input.input.metadata
                        ? {
                            metadata: toPrismaJson(input.input.metadata)
                        }
                        : {})
                }
            });

        return this.toDomain(action);
    }

    async get(
        actionId: string
    ): Promise<Action | null> {
        const action =
            await this.prisma.action.findUnique({
                where: {
                    id: actionId
                }
            });

        return action
            ? this.toDomain(action)
            : null;
    }

    async update(
        actionId: string,
        update: {
            readonly status?: Action["status"];
            readonly startedAt?: Date;
            readonly completedAt?: Date;
            readonly beforeSnapshotId?: string;
            readonly afterHash?: string;
        }
    ): Promise<Action> {
        try {
            const action =
                await this.prisma.action.update({
                    where: {
                        id: actionId
                    },
                    data: {
                        ...(update.status !== undefined
                            ? {
                                status: update.status
                            }
                            : {}),

                        ...(update.startedAt !== undefined
                            ? {
                                startedAt: update.startedAt
                            }
                            : {}),

                        ...(update.completedAt !== undefined
                            ? {
                                completedAt: update.completedAt
                            }
                            : {}),

                        ...(update.beforeSnapshotId !== undefined
                            ? {
                                beforeSnapshotId:
                                    update.beforeSnapshotId
                            }
                            : {}),

                        ...(update.afterHash !== undefined
                            ? {
                                afterHash: update.afterHash
                            }
                            : {})
                    }
                });

            return this.toDomain(action);
        } catch (error) {
            throw new MercyError(
                "ACTION_NOT_FOUND",
                `Action not found: ${actionId}`,
                { cause: error }
            );
        }
    }

    async list(
        projectId: string
    ): Promise<readonly Action[]> {
        const actions =
            await this.prisma.action.findMany({
                where: {
                    projectId
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

        return actions.map(
            (action) =>
                this.toDomain(action)
        );
    }

    private toDomain(
        action: {
            id: string;
            projectId: string;
            type: string;
            target: string;
            status: string;
            undoStrategy: string;
            createdAt: Date;
            startedAt: Date | null;
            completedAt: Date | null;
            beforeSnapshotId: string | null;
            afterHash: string | null;
            metadata: unknown;
        }
    ): Action {
        return {
            id: action.id,
            projectId: action.projectId,
            type:
                action.type as Action["type"],
            target: action.target,
            status:
                action.status as Action["status"],
            undoStrategy:
                action.undoStrategy as Action["undoStrategy"],
            createdAt: action.createdAt,

            ...(action.startedAt
                ? {
                    startedAt:
                        action.startedAt
                }
                : {}),

            ...(action.completedAt
                ? {
                    completedAt:
                        action.completedAt
                }
                : {}),

            ...(action.beforeSnapshotId
                ? {
                    beforeSnapshotId:
                        action.beforeSnapshotId
                }
                : {}),

            ...(action.afterHash
                ? {
                    afterHash:
                        action.afterHash
                }
                : {}),

            ...(action.metadata
                ? {
                    metadata:
                        action.metadata as Record<
                            string,
                            unknown
                        >
                }
                : {})
        };
    }
}