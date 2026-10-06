import type {
  ActionGroup,
  ActionGroupInput,
  GroupUndoResult
} from "@mercy/core";
import type { ActionGroupJournal } from "@mercy/journal";
import { MercyError } from "@mercy/shared";
import type {
  PrismaClient,
  Prisma
} from "../../generated/prisma/client";

type ActionGroupWithActions =
  Prisma.ActionGroupGetPayload<{
    include: {
      actions: {
        orderBy: {
          position: "asc";
        };
      };
    };
  }>;

export class PostgresActionGroupJournal
  implements ActionGroupJournal {
  constructor(
    private readonly prisma: PrismaClient
  ) { }

  async create(
    input: ActionGroupInput & {
      readonly id: string;
    }
  ): Promise<ActionGroup> {
    const group =
      await this.prisma.actionGroup.create({
        data: {
          id: input.id,
          projectId: input.projectId,
          status: "pending"
        }
      });

    return this.requireGroupAndMap(group.id);
  }

  async addAction(
    groupId: string,
    actionId: string,
  ): Promise<ActionGroup> {
    const group = await this.requireGroup(groupId);

    const existing = group.actions.some(
      (item) => item.actionId === actionId,
    );

    if (existing) {
      return this.toDomain(group);
    }

    const position =
      group.actions.length === 0
        ? 0
        : Math.max(
          ...group.actions.map(
            (item) => item.position,
          ),
        ) + 1;

    await this.prisma.actionGroupAction.create({
      data: {
        groupId,
        actionId,
        position,
      },
    });

    return this.requireGroupAndMap(groupId);
  }

  async markRunning(
    groupId: string
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "running"
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async markCompleted(
    groupId: string
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async markFailed(
    groupId: string,
    error: string
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "failed",
        error
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async markUndoing(
    groupId: string
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "undoing"
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async markUndone(
    groupId: string,
    _result: GroupUndoResult
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "undone",
        completedAt: new Date(),
        error: null
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async markUndoFailed(
    groupId: string,
    result: GroupUndoResult
  ): Promise<ActionGroup> {
    await this.requireGroup(groupId);

    await this.prisma.actionGroup.update({
      where: {
        id: groupId
      },
      data: {
        status: "undo_failed",
        error: result.error ?? null
      }
    });

    return this.requireGroupAndMap(groupId);
  }

  async get(
    groupId: string
  ): Promise<ActionGroup | null> {
    const group =
      await this.prisma.actionGroup.findUnique({
        where: {
          id: groupId
        },
        include: {
          actions: {
            orderBy: {
              position: "asc"
            }
          }
        }
      });

    if (!group) {
      return null;
    }

    return this.toDomain(group);
  }

  async list(
    projectId: string
  ): Promise<readonly ActionGroup[]> {
    const groups =
      await this.prisma.actionGroup.findMany({
        where: {
          projectId
        },
        orderBy: {
          createdAt: "asc"
        },
        include: {
          actions: {
            orderBy: {
              position: "asc"
            }
          }
        }
      });

    return groups.map((group) =>
      this.toDomain(group)
    );
  }

  private async requireGroup(
    groupId: string
  ): Promise<ActionGroupWithActions> {
    const group =
      await this.prisma.actionGroup.findUnique({
        where: {
          id: groupId
        },
        include: {
          actions: {
            orderBy: {
              position: "asc"
            }
          }
        }
      });

    if (!group) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action group not found: ${groupId}`
      );
    }

    return group;
  }

  private async requireGroupAndMap(
    groupId: string
  ): Promise<ActionGroup> {
    const group =
      await this.requireGroup(groupId);

    return this.toDomain(group);
  }

  private toDomain(
    group: ActionGroupWithActions
  ): ActionGroup {
    return {
      id: group.id,
      projectId: group.projectId,
      status: group.status as ActionGroup["status"],
      actionIds: group.actions.map(
        (action) => action.actionId
      ),
      createdAt: group.createdAt,
      ...(group.completedAt
        ? {
          completedAt: group.completedAt
        }
        : {}),
      ...(group.error
        ? {
          error: group.error
        }
        : {})
    };
  }
}