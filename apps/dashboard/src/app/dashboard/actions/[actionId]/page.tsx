import Link from "next/link";
import { notFound } from "next/navigation";

import { getAction } from "@/lib/mercy-api";

import { UndoActionButton } from "@/components/dashboard";

function StatusBadge({ status }: { status: string }) {
  const positive =
    status === "completed" || status === "undone";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 ${
          positive ? "bg-[#39FF14]" : "bg-black/20"
        }`}
      />

      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/60">
        {status}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-6 border-b border-black/10 py-4 last:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">
        {label}
      </p>

      <p
        className={
          mono
            ? "break-all font-mono text-xs text-black/70"
            : "text-sm text-black/70"
        }
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;

  const action = await getAction(actionId);

  if (!action) {
    notFound();
  }

  const hasSnapshot = Boolean(action.beforeSnapshotId);

  const recoveryAvailable =
    hasSnapshot &&
    (action.status === "completed" ||
      action.status === "undo_failed");

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-8">
        <Link
          href="/dashboard/actions"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35 transition-colors hover:text-black"
        >
          ← Actions
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-black/35">
                {action.type}
              </span>

              <span className="h-1 w-1 bg-black/20" />

              <StatusBadge status={action.status} />
            </div>

            <h1 className="mt-4 break-all font-mono text-3xl font-semibold tracking-[-0.03em]">
              {action.target}
            </h1>

            <p className="mt-3 break-all font-mono text-[10px] text-black/35">
              {action.id}
            </p>
          </div>

          {recoveryAvailable && (
            <UndoActionButton actionId={action.id} />
          )}
        </div>
      </div>

      {/* Lifecycle */}
      <section className="mt-8">
        <div className="border-y border-black/10 bg-white">
          <div className="grid md:grid-cols-4">
            <div className="border-b border-black/10 px-5 py-5 md:border-b-0 md:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Capture
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${
                    hasSnapshot ? "bg-[#39FF14]" : "bg-black/20"
                  }`}
                />

                <span className="text-sm font-medium">
                  {hasSnapshot
                    ? "Snapshot captured"
                    : "No snapshot"}
                </span>
              </div>
            </div>

            <div className="border-b border-black/10 px-5 py-5 md:border-b-0 md:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Execute
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${
                    action.status === "completed" ||
                    action.status === "undone"
                      ? "bg-[#39FF14]"
                      : "bg-black/20"
                  }`}
                />

                <span className="text-sm font-medium">
                  {action.status === "completed" ||
                  action.status === "undone"
                    ? "Action completed"
                    : action.status}
                </span>
              </div>
            </div>

            <div className="border-b border-black/10 px-5 py-5 md:border-b-0 md:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Verify
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${
                    action.afterHash
                      ? "bg-[#39FF14]"
                      : "bg-black/20"
                  }`}
                />

                <span className="text-sm font-medium">
                  {action.afterHash
                    ? "State recorded"
                    : "Not available"}
                </span>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Recovery
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${
                    recoveryAvailable
                      ? "bg-[#39FF14]"
                      : "bg-black/20"
                  }`}
                />

                <span className="text-sm font-medium">
                  {recoveryAvailable
                    ? "Available"
                    : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="border-b border-black/10 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
              Action details
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Execution
            </h2>
          </div>

          <div className="mt-4 border-y border-black/10 bg-white px-5">
            <DetailRow
              label="Action ID"
              value={action.id}
              mono
            />

            <DetailRow
              label="Project"
              value={action.projectId}
              mono
            />

            <DetailRow
              label="Type"
              value={action.type}
              mono
            />

            <DetailRow
              label="Target"
              value={action.target}
              mono
            />

            <DetailRow
              label="Undo strategy"
              value={action.undoStrategy}
              mono
            />

            <DetailRow
              label="Status"
              value={action.status}
              mono
            />
          </div>
        </section>

        <section>
          <div className="border-b border-black/10 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
              Recovery state
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Snapshot
            </h2>
          </div>

          <div className="mt-4 border-y border-black/10 bg-white px-5">
            <DetailRow
              label="Snapshot ID"
              value={action.beforeSnapshotId ?? "—"}
              mono
            />

            <DetailRow
              label="After hash"
              value={action.afterHash ?? "—"}
              mono
            />

            <DetailRow
              label="Recovery"
              value={
                recoveryAvailable
                  ? "Available"
                  : "Unavailable"
              }
            />
          </div>
        </section>
      </div>

      {/* Timeline */}
      <section className="mt-12">
        <div className="border-b border-black/10 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
            Timeline
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Action lifecycle
          </h2>
        </div>

        <div className="mt-4 border-y border-black/10 bg-white">
          <div className="grid grid-cols-[12px_1fr_auto] gap-4 border-b border-black/10 px-5 py-5">
            <span
              className={`mt-1.5 h-2 w-2 ${
                hasSnapshot
                  ? "bg-[#39FF14]"
                  : "bg-black/15"
              }`}
            />

            <div>
              <p className="text-sm font-medium">
                Snapshot captured
              </p>

              <p className="mt-1 text-xs text-black/45">
                State required for recovery was persisted before execution.
              </p>
            </div>

            <p className="font-mono text-[10px] text-black/30">
              {formatDate(action.startedAt)}
            </p>
          </div>

          <div className="grid grid-cols-[12px_1fr_auto] gap-4 border-b border-black/10 px-5 py-5">
            <span
              className={`mt-1.5 h-2 w-2 ${
                action.status === "completed" ||
                action.status === "undone"
                  ? "bg-[#39FF14]"
                  : "bg-black/15"
              }`}
            />

            <div>
              <p className="text-sm font-medium">
                Action {action.status}
              </p>

              <p className="mt-1 text-xs text-black/45">
                The target execution lifecycle reached its current state.
              </p>
            </div>

            <p className="font-mono text-[10px] text-black/30">
              {formatDate(action.completedAt)}
            </p>
          </div>

          <div className="grid grid-cols-[12px_1fr_auto] gap-4 px-5 py-5">
            <span
              className={`mt-1.5 h-2 w-2 ${
                recoveryAvailable
                  ? "bg-[#39FF14]"
                  : "bg-black/15"
              }`}
            />

            <div>
              <p className="text-sm font-medium">
                Recovery{" "}
                {recoveryAvailable
                  ? "available"
                  : "unavailable"}
              </p>

              <p className="mt-1 text-xs text-black/45">
                {recoveryAvailable
                  ? "The action can be undone using its captured recovery state."
                  : "No usable recovery state is currently available."}
              </p>
            </div>

            <p className="font-mono text-[10px] text-black/30">
              {recoveryAvailable ? "ready" : "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}