"use client";

import {
usePathname,
useRouter,
useSearchParams,
} from "next/navigation";
import { useEffect } from "react";

import { useProjectStore } from "@/stores/project-store";

const titles: Record<string, string> = {
"/dashboard": "Overview",
"/dashboard/actions": "Actions",
"/dashboard/groups": "Groups",
"/dashboard/systems": "Systems",
};

function getTitle(pathname: string): string {
if (titles[pathname]) {
return titles[pathname];
}

if (pathname.startsWith("/dashboard/actions/")) {
return "Action";
}

if (pathname.startsWith("/dashboard/groups/")) {
return "Group";
}

return "Dashboard";
}

export function Topbar() {
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

const urlProjectId = searchParams.get("project");
const selectedProjectId =
urlProjectId ?? projects[0]?.id ?? null;

useEffect(() => {
if (selectedProjectId) {
  setSelectedProject(selectedProjectId);
}
}, [selectedProjectId, setSelectedProject]);

const title = getTitle(pathname);

const selectedProject = projects.find(
(project) =>
project.id === selectedProjectId,
);

function handleProjectChange(
event: React.ChangeEvent<HTMLSelectElement>,
) {
const projectId = event.target.value;

setSelectedProject(projectId);

router.push(
  `/dashboard?project=${encodeURIComponent(projectId)}`,
);

}

return ( <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-white px-6 lg:px-8"> <div> <p className="text-sm font-medium">
{title} </p> </div>

  <div className="flex items-center gap-5">
    <div className="hidden items-center gap-2 sm:flex">
      <span className="h-1.5 w-1.5 bg-[#39FF14]" />

      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
        API connected
      </span>
    </div>

    <div className="h-7 w-px bg-black/10" />

    {projects.length > 0 ? (
      <select
        value={selectedProjectId ?? ""}
        onChange={handleProjectChange}
        aria-label="Select project"
        className="h-8 min-w-40 border border-black/10 bg-white px-3 text-xs font-medium outline-none transition-colors hover:border-black/30 focus:border-black"
      >
        {projects.map((project) => (
          <option
            key={project.id}
            value={project.id}
          >
            {project.name}
          </option>
        ))}
      </select>
    ) : (
      <div className="flex h-8 min-w-40 items-center border border-black/10 px-3 text-xs text-black/40">
        No projects
      </div>
    )}

    {selectedProject ? (
      <span className="hidden font-mono text-[10px] text-black/30 xl:block">
        {selectedProject.id}
      </span>
    ) : null}
  </div>
</header>

);
}
