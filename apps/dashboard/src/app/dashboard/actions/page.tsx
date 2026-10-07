import Link from "next/link";

import { listActions } from "@/lib/mercy-api";

const PROJECT_ID = "real-db-ab69cf62-0912-4d9e-8e36-780bcc3665aa";

function StatusBadge({ status }: { status: string }) {
  const positive =
    status === "completed" || status === "undone";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 ${
          positive ? "bg-[#39FF14]" : "bg-black/20"
        }`}
      />

      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/55">
        {status}
      </span>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));

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

export default async function ActionsPage() {
  const actions = await listActions(PROJECT_ID);
  console.log(actions)

  const completed = actions.filter(
    (action) => action.status === "completed",
  ).length;

  const undone = actions.filter(
    (action) => action.status === "undone",
  ).length;

  const failed = actions.filter(
    (action) =>
      action.status === "failed" ||
      action.status === "undo_failed",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
          Workspace
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              Actions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
              Every supported action executed through Mercy,
              including its recovery state and undo strategy.
            </p>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            project / {PROJECT_ID}
          </div>
        </div>
      </div>

      {/* Summary */}
      <section className="mt-8">
        <div className="grid border-y border-black/10 bg-white sm:grid-cols-4">
          <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Total
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {actions.length}
            </p>
          </div>

          <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Completed
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {completed}
            </p>
          </div>

          <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Undone
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {undone}
            </p>
          </div>

          <div className="px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Failed
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {failed}
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="mt-10">
        <div className="flex items-end justify-between border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
              Action history
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Recent actions
            </h2>
          </div>

          <p className="hidden font-mono text-[10px] text-black/30 sm:block">
            {actions.length} total
          </p>
        </div>

        <div className="mt-4 overflow-hidden border-y border-black/10 bg-white">
          {/* Table header */}
          <div className="hidden grid-cols-[0.6fr_1.4fr_0.8fr_0.8fr_0.5fr_0.6fr] border-b border-black/10 px-5 py-3 lg:grid">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Type
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Target
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Status
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Strategy
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Snapshot
            </p>

            <p className="text-right font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Time
            </p>
          </div>

          {actions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium">
                No actions yet
              </p>

              <p className="mt-2 text-xs text-black/40">
                Actions executed through Mercy will appear here.
              </p>
            </div>
          ) : (
            actions.map((action) => (
              <Link
                key={action.id}
                href={`/dashboard/actions/${action.id}`}
                className="block border-b border-black/10 px-5 py-4 transition-colors last:border-b-0 hover:bg-black/[0.025]"
              >
                {/* Desktop row */}
                <div className="hidden items-center lg:grid lg:grid-cols-[0.6fr_1.4fr_0.8fr_0.8fr_0.5fr_0.6fr]">
                  <p className="font-mono text-xs text-black/55">
                    {action.type}
                  </p>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {action.target}
                    </p>

                    <p className="mt-1 truncate font-mono text-[9px] text-black/30">
                      {action.id}
                    </p>
                  </div>

                  <StatusBadge status={action.status} />

                  <p className="font-mono text-xs text-black/45">
                    {action.undoStrategy}
                  </p>

                  <p className="font-mono text-xs text-black/45">
                    {action.beforeSnapshotId ? "YES" : "—"}
                  </p>

                  <p className="text-right font-mono text-[10px] text-black/35">
                    {formatRelativeTime(new Date(action.createdAt))}
                  </p>
                </div>

                {/* Mobile row */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {action.target}
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-black/30">
                        {action.id}
                      </p>
                    </div>

                    <StatusBadge status={action.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 border-t border-black/10 pt-4">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                        Type
                      </p>

                      <p className="mt-2 font-mono text-xs text-black/55">
                        {action.type}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                        Strategy
                      </p>

                      <p className="mt-2 font-mono text-xs text-black/55">
                        {action.undoStrategy}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                        Snapshot
                      </p>

                      <p className="mt-2 font-mono text-xs text-black/55">
                        {action.beforeSnapshotId ? "YES" : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-b border-black/10 py-4">
          <p className="font-mono text-[10px] text-black/35">
            Showing {actions.length} actions
          </p>
        </div>
      </section>
    </div>
  );
}