"use client";

import { useEffect } from "react";

import type { Project } from "@/lib/mercy-api";
import { useProjectStore } from "@/stores/project-store";

interface ProjectProviderProps {
readonly projects: readonly Project[];
readonly children: React.ReactNode;
}

export function ProjectProvider({
projects,
children,
}: ProjectProviderProps) {
const setProjects =
useProjectStore(
(state) => state.setProjects,
);

useEffect(() => {
setProjects(projects);
}, [projects, setProjects]);

return children;
}
