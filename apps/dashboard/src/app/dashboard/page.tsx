import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import {
  listActions,
  listProjects,
} from "@/lib/mercy-api";
import { resolveProject } from "@/lib/dashboard-project";

import { CreateProjectForm } from "@/components/dashboard/create-project-form";

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
interface DashboardPageProps {
  searchParams: Promise<{
    project?: string;
  }>;
}
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    throw new Error("Unable to authenticate with Mercy API");
  }

  const projects = await listProjects(token);
  const params = await searchParams;
  const project = resolveProject(
    projects,
    params.project,
  );

  if (!project) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <CreateProjectForm />
      </div>
    );
  }

  const projectId = project.id;

  const actions = await listActions(
    projectId,
    token,
  );

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

  const recentActions = [...actions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/40">
              Runtime overview
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Overview
            </h1>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Recovery state across your Mercy runtime.
            </p>
          </div>

          <div className="font-mono text-xs text-black/40">
            project:{" "}
            <span className="text-black">
              {projectId}
            </span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 border border-black/10 bg-white sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-black/10 p-5 sm:border-r lg:border-b-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
              Total actions
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {actions.length}
            </p>
          </div>

          <div className="border-b border-black/10 p-5 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
              Completed
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {completed}
            </p>
          </div>

          <div className="border-b border-black/10 p-5 sm:border-r sm:border-b-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
              Undone
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {undone}
            </p>
          </div>

          <div className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
              Failed
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {failed}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <section className="border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-sm font-medium">
                  Recent actions
                </p>

                <p className="mt-1 text-xs text-black/40">
                  Latest actions processed by Mercy.
                </p>
              </div>

              <Link
                href={`/dashboard/actions?project=${encodeURIComponent(projectId)}`}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black"
              >
                View all →
              </Link>
            </div>

            {recentActions.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto h-2 w-2 bg-[#39FF14]" />

                <p className="mt-5 text-sm font-medium">
                  No actions yet
                </p>

                <p className="mt-2 text-sm text-black/40">
                  Actions will appear here once Mercy processes them.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {recentActions.map((action) => (
                  <Link
                    key={action.id}
                    href={`/dashboard/actions/${action.id}?project=${encodeURIComponent(projectId)}`}
                    className="block px-5 py-4 transition-colors hover:bg-[#F7F7F7]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                        <p className="mt-2 truncate font-mono text-[10px] text-black/40">
                          {action.target}
                        </p>
                      </div>

                      <span className="shrink-0 font-mono text-[10px] text-black/30">
                        {formatRelativeTime(
                          new Date(action.createdAt),
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="border border-black/10 bg-black text-white">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-medium">
                Runtime status
              </p>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#39FF14]" />

                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                    Operational
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                  Active
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Project
                </p>

                <p className="mt-2 font-mono text-xs text-white/70">
                  {projectId}
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Recovery
                </p>

                <p className="mt-2 text-sm text-white/70">
                  Snapshot-backed actions enabled.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}