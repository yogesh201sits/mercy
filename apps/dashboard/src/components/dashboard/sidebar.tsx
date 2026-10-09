"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";

import { useProjectStore } from "@/stores/project-store";

const navigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Actions", href: "/dashboard/actions" },
  { label: "Groups", href: "/dashboard/groups" },
  { label: "Systems", href: "/dashboard/systems" },
  { label: "API Keys", href: "/dashboard/api-keys" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projects = useProjectStore(
    (state) => state.projects,
  );

  const setSelectedProject =
    useProjectStore(
      (state) => state.setSelectedProject,
    );

  /*
   * Prevent client-only Zustand state from changing
   * the first render and causing hydration mismatch.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function selectProject(projectId: string) {
    setSelectedProject(projectId);

    router.push(
      `/dashboard?project=${encodeURIComponent(projectId)}`,
    );
  }

  const urlProjectId =
    searchParams.get("project");

  const effectiveProjectId =
    urlProjectId ??
    (mounted ? projects[0]?.id ?? null : null);

  const projectSelectorValue =
    effectiveProjectId ??
    (mounted ? projects[0]?.id ?? "" : "");
  const selectedProject = projects.find(
    (project) => project.id === effectiveProjectId,
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-white/10 bg-[#050505] text-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="border-b border-white/10 px-6">
          <div className="flex h-16 items-center">
            <Link
              href={
                effectiveProjectId
                  ? `/dashboard?project=${encodeURIComponent(
                      effectiveProjectId,
                    )}`
                  : "/dashboard"
              }
              className="flex items-center text-lg font-semibold tracking-tight"
            >
              <img
                src="/logo.png"
                alt="Mercy"
                className="h-10 w-16 scale-140 gap-1 object-contain drop-shadow-[0.5px_1px_0_rgb(0_0_0_/_35%)]"
              />

              mercy
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3 py-6">
          {/* Workspace */}
          <div className="px-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
              Workspace
            </p>
          </div>

          {/* Navigation */}
          <nav className="mt-3 space-y-1">
            {navigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(
                      item.href,
                    );

              const href =
                effectiveProjectId
                  ? `${item.href}?project=${encodeURIComponent(
                      effectiveProjectId,
                    )}`
                  : item.href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`group flex h-10 items-center gap-3 border-l-2 px-3 text-sm transition-colors ${
                    active
                      ? "border-[#39FF14] bg-[#39FF14]/10 text-white"
                      : "border-transparent text-white/45 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 ${
                      active
                        ? "bg-[#39FF14]"
                        : "bg-white/20 group-hover:bg-[#39FF14]"
                    }`}
                  />

                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="mt-auto border-t border-white/10 pt-5">
            <div className="px-3">
              {/* Project selector */}
              <div className="pb-5">
                <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                  Project
                </p>

                {projects.length > 0 ? (
                  <>
                    <select
                      value={projectSelectorValue}
                      onChange={(event) =>
                        selectProject(
                          event.target.value,
                        )
                      }
                      aria-label="Select project"
                      className="h-9 w-full border border-white/10 bg-white/5 px-3 font-mono text-[10px] text-white outline-none transition-colors hover:border-[#39FF14]/50 focus:border-[#39FF14]"
                    >
                      {projects.map((project) => (
                        <option
                          key={project.id}
                          value={project.id}
                          className="bg-[#050505] text-white"
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {selectedProject ? (
                      <div className="mt-2 min-w-0 px-1">
                        <p className="truncate text-[10px]">
                          {selectedProject.name}
                        </p>

                        <p className="mt-0.5 truncate font-mono text-[8px] text-white/25">
                          {selectedProject.id}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="border border-white/10 px-3 py-2 font-mono text-[10px] text-white/30">
                    No projects
                  </div>
                )}

                <Link
                  href="/dashboard/projects/new"
                  className="mt-2 flex h-8 items-center justify-center border border-white/10 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:border-[#39FF14] hover:bg-[#39FF14] hover:text-black"
                >
                  + New project
                </Link>
              </div>

              {/* Runtime */}
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                Runtime
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 bg-[#39FF14]" />

                <span className="text-xs text-white/60">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile navigation */}
      <div className="border-b border-black/10 bg-[#050505] text-white lg:hidden">
        <div className="flex min-h-14 items-center justify-between gap-4 px-4">
          <Link
            href={
              effectiveProjectId
                ? `/dashboard?project=${encodeURIComponent(
                    effectiveProjectId,
                  )}`
                : "/dashboard"
            }
            className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight"
          >
            <span className="h-2 w-2 bg-[#39FF14]" />

            mercy
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 bg-[#39FF14]" />

            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
              Operational
            </span>
          </div>
        </div>

        {/* Mobile project selector */}
        <div className="border-t border-white/10 px-3 py-3">
          {projects.length > 0 ? (
            <select
              value={projectSelectorValue}
              onChange={(event) =>
                selectProject(
                  event.target.value,
                )
              }
              aria-label="Select project"
              className="h-9 w-full border border-white/10 bg-white/5 px-3 font-mono text-[10px] text-white outline-none transition-colors hover:border-[#39FF14]/50 focus:border-[#39FF14]"
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                  className="bg-[#050505] text-white"
                >
                  {project.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="border border-white/10 px-3 py-2 font-mono text-[10px] text-white/30">
              No projects
            </div>
          )}
        </div>

        {/* Mobile navigation */}
        <nav className="flex overflow-x-auto border-t border-white/10 px-2">
          {navigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(
                    item.href,
                  );

            const href =
              effectiveProjectId
                ? `${item.href}?project=${encodeURIComponent(
                    effectiveProjectId,
                  )}`
                : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={`flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-xs transition-colors ${
                  active
                    ? "border-[#39FF14] text-white"
                    : "border-transparent text-white/40 hover:border-[#39FF14]/50 hover:bg-[#39FF14]/10 hover:text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 ${
                    active
                      ? "bg-[#39FF14]"
                      : "bg-white/20"
                  }`}
                />

                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}