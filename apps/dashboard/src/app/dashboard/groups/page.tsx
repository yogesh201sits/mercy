import Link from "next/link";

import { listGroups } from "@/lib/mercy-api";

const PROJECT_ID = "default";

function formatRelativeTime(date: Date): string {
const diff = Date.now() - date.getTime();
const seconds = Math.floor(diff / 1000);

if (seconds < 60) {
return `${seconds}s ago`;
}

const minutes = Math.floor(seconds / 60);

if (minutes < 60) {
return `${minutes}m ago`;
}

const hours = Math.floor(minutes / 60);

if (hours < 24) {
return `${hours}h ago`;
}

const days = Math.floor(hours / 24);

return `${days}d ago`;
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

export default async function GroupsPage() {
const groups = await listGroups(PROJECT_ID);

const completed = groups.filter(
(group) => group.status === "completed",
).length;

const undone = groups.filter(
(group) => group.status === "undone",
).length;

return ( <div className="p-6 lg:p-8"> <div className="mx-auto max-w-7xl"> <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"> <div> <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/40">
Recovery groups </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Groups
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">
          Related actions grouped into a single recoverable operation.
        </p>
      </div>

      <div className="font-mono text-xs text-black/40">
        project: <span className="text-black">{PROJECT_ID}</span>
      </div>
    </div>

    <div className="mb-6 grid grid-cols-1 border border-black/10 bg-white sm:grid-cols-3">
      <div className="border-b border-black/10 p-5 sm:border-b-0 sm:border-r">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Total groups
        </p>

        <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {groups.length}
        </p>
      </div>

      <div className="border-b border-black/10 p-5 sm:border-b-0 sm:border-r">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Completed
        </p>

        <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {completed}
        </p>
      </div>

      <div className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          Undone
        </p>

        <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {undone}
        </p>
      </div>
    </div>

    <div className="border border-black/10 bg-white">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <div>
          <p className="text-sm font-medium">Action groups</p>
          <p className="mt-1 text-xs text-black/40">
            Recovery operations tracked by Mercy.
          </p>
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">
          {groups.length} groups
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto h-2 w-2 bg-[#39FF14]" />

          <p className="mt-5 text-sm font-medium">
            No groups yet
          </p>

          <p className="mt-2 text-sm text-black/40">
            Groups will appear here when related actions are created.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {groups.map((group) => {
            const actionCount = group.actionIds.length;

            return (
              <Link
                key={group.id}
                href={`/dashboard/groups/${group.id}`}
                className="group block px-5 py-5 transition-colors hover:bg-[#F7F7F7]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="h-1.5 w-1.5 shrink-0 bg-[#39FF14]" />

                      <p className="truncate font-mono text-sm font-medium">
                        {group.id}
                      </p>

                      <span
                        className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${statusClass(
                          group.status,
                        )}`}
                      >
                        {group.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] text-black/40">
                      <span>
                        project: {group.projectId}
                      </span>

                      <span>
                        {actionCount}{" "}
                        {actionCount === 1 ? "action" : "actions"}
                      </span>

                      {group.error && (
                        <span className="text-black/60">
                          error: {group.error}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 font-mono text-[10px] text-black/40">
                    {formatRelativeTime(
                      new Date(group.createdAt),
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  </div>
</div>
);
}
