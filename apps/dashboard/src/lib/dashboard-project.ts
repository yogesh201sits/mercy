import type { Project } from "@/lib/mercy-api";

export function resolveProject(
  projects: readonly Project[],
  requestedProjectId?: string,
): Project | null {
  if (requestedProjectId) {
    return (
      projects.find(
        (project) =>
          project.id === requestedProjectId,
      ) ?? null
    );
  }

  return projects[0] ?? null;
}