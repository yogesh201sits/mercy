import type {
  ActionGroup,
  ActionGroupInput,
  GroupUndoResult
} from "@mercy/core";
import { MercyError } from "@mercy/shared";
import type { ActionGroupJournal } from "./group-journal";

export class InMemoryActionGroupJournal implements ActionGroupJournal {
  private readonly groups = new Map<string, ActionGroup>();

  async create(
    input: ActionGroupInput & { readonly id: string }
  ): Promise<ActionGroup> {
    if (this.groups.has(input.id)) {
      throw new MercyError(
        "INVALID_INPUT",
        `Action group already exists: ${input.id}`
      );
    }

    const group: ActionGroup = {
      id: input.id,
      projectId: input.projectId,
      status: "pending",
      actionIds: [],
      createdAt: new Date()
    };

    this.groups.set(group.id, group);

    return group;
  }

  async addAction(
    groupId: string,
    actionId: string
  ): Promise<ActionGroup> {
    const group = this.require(groupId);

    if (group.actionIds.includes(actionId)) {
      return group;
    }

    const updated: ActionGroup = {
      ...group,
      actionIds: [...group.actionIds, actionId]
    };

    this.groups.set(groupId, updated);

    return updated;
  }

  async markRunning(groupId: string): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "running"
    });
  }

  async markCompleted(groupId: string): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "completed",
      completedAt: new Date()
    });
  }

  async markFailed(
    groupId: string,
    error: string
  ): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "failed",
      error
    });
  }

  async markUndoing(groupId: string): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "undoing"
    });
  }

  async markUndone(
    groupId: string,
    _result: GroupUndoResult
  ): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "undone",
      completedAt: new Date()
    });
  }

  async markUndoFailed(
    groupId: string,
    result: GroupUndoResult
  ): Promise<ActionGroup> {
    return this.update(groupId, {
      status: "undo_failed",
      error: result.error??""
    });
  }

  async get(groupId: string): Promise<ActionGroup | null> {
    return this.groups.get(groupId) ?? null;
  }

  async list(
    projectId: string
  ): Promise<readonly ActionGroup[]> {
    return [...this.groups.values()].filter(
      (group) => group.projectId === projectId
    );
  }

  private require(groupId: string): ActionGroup {
    const group = this.groups.get(groupId);

    if (!group) {
      throw new MercyError(
        "ACTION_NOT_FOUND",
        `Action group not found: ${groupId}`
      );
    }

    return group;
  }

  private update(
    groupId: string,
    changes: Partial<ActionGroup>
  ): ActionGroup {
    const group = this.require(groupId);

    const updated: ActionGroup = {
      ...group,
      ...changes
    };

    this.groups.set(groupId, updated);

    return updated;
  }
}