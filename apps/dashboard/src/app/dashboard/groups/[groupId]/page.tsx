import Link from "next/link";
import { notFound } from "next/navigation";

import { UndoGroupButton } from "@/components/dashboard";

import { getAction, getGroup } from "@/lib/mercy-api";

interface GroupDetailPageProps {
readonly params: Promise<{
groupId: string;
}>;
}

function formatDate(date: Date): string {
return new Intl.DateTimeFormat("en-US", {
year: "numeric",
month: "short",
day: "2-digit",
hour: "2-digit",
minute: "2-digit",
second: "2-digit",
}).format(date);
}

function statusClass(status: string): string {
switch (status) {
case "completed":
return "border-[#39FF14]/40 bg-[#39FF14]/10 text-black";

case "undone":
  return "border-black/15 bg-black/[0.03] text-black/60";

case "failed":
case "undo_failed":
  return "border-black/20 bg-black/[0.04] text-black";

default:
  return "border-black/10 bg-white text-black/60";

}
}

export default async function GroupDetailPage({
params,
}: GroupDetailPageProps) {
const { groupId } = await params;

const group = await getGroup(groupId);

if (!group) {
notFound();
}

const actions = await Promise.all(
group.actionIds.map((actionId) => getAction(actionId)),
);

const resolvedActions = actions.filter(
(action): action is NonNullable<typeof action> => action !== null,
);

const canUndo =
group.status === "completed" || group.status === "undo_failed";

return ( <div className="p-6 lg:p-8"> <div className="mx-auto max-w-7xl"> <div className="mb-8"> <Link
         href="/dashboard/groups"
         className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40 transition-colors hover:text-black"
       >
← Back to groups </Link>

      <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/40">
            Recovery group
          </p>

          <h1 className="mt-2 break-all font-mono text-xl font-semibold tracking-[-0.02em] lg:text-2xl">
            {group.id}
          </h1>
        </div>

        <span
          className={`w-fit border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${statusClass(
            group.status,
          )}`}
        >
          {group.status.replace("_", " ")}
        </span>
      </div>
    </div>

    <div className="mb-6 grid grid-cols-1 border border-black/10 bg-white md:grid-cols-3">
      <div className="border-b border-black/10 p-5 md:border-b-0 md:border-r">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Project
        </p>

        <p className="mt-3 font-mono text-sm">
          {group.projectId}
        </p>
      </div>

      <div className="border-b border-black/10 p-5 md:border-b-0 md:border-r">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Actions
        </p>

        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
          {group.actionIds.length}
        </p>
      </div>

      <div className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Created
        </p>

        <p className="mt-3 font-mono text-xs text-black/60">
          {formatDate(new Date(group.createdAt))}
        </p>
      </div>
    </div>

    <div className="mb-6 border border-black/10 bg-white">
      <div className="flex flex-col gap-4 border-b border-black/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Recovery</p>

          <p className="mt-1 text-xs text-black/40">
            Undo the actions in this group as a single operation.
          </p>
        </div>

        {canUndo && <UndoGroupButton groupId={group.id} />}

      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 ${
              canUndo ? "bg-[#39FF14]" : "bg-black/20"
            }`}
          />

          <span className="text-xs text-black/50">
            {canUndo
              ? "Recovery available"
              : "Recovery unavailable for this group"}
          </span>
        </div>
      </div>
    </div>

    <div className="border border-black/10 bg-white">
      <div className="border-b border-black/10 px-5 py-4">
        <p className="text-sm font-medium">Actions</p>

        <p className="mt-1 text-xs text-black/40">
          Actions belonging to this recovery group.
        </p>
      </div>

      {resolvedActions.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto h-2 w-2 bg-[#39FF14]" />

          <p className="mt-5 text-sm font-medium">
            No actions found
          </p>

          <p className="mt-2 text-sm text-black/40">
            The group does not currently contain resolvable actions.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {resolvedActions.map((action) => (
            <Link
              key={action.id}
              href={`/dashboard/actions/${action.id}`}
              className="block px-5 py-5 transition-colors hover:bg-[#F7F7F7]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 bg-[#39FF14]" />

                    <span className="font-mono text-xs font-medium">
                      {action.id}
                    </span>

                    <span className="border border-black/10 bg-black/[0.03] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-black/50">
                      {action.type}
                    </span>

                    <span
                      className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${statusClass(
                        action.status,
                      )}`}
                    >
                      {action.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mt-3 truncate font-mono text-xs text-black/50">
                    {action.target}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-black/30">
                  {formatDate(new Date(action.createdAt))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>

    {group.completedAt && (
      <div className="mt-6 border border-black/10 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">
            Completed
          </span>

          <span className="font-mono text-xs text-black/60">
            {formatDate(new Date(group.completedAt))}
          </span>
        </div>
      </div>
    )}

    {group.error && (
      <div className="mt-6 border border-black/10 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">
            Error
          </span>

          <span className="max-w-2xl text-right font-mono text-xs text-black/60">
            {group.error}
          </span>
        </div>
      </div>
    )}
  </div>
</div>

);
}
