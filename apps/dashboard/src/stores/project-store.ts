"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Project } from "@/lib/mercy-api";

interface ProjectState {
projects: readonly Project[];
selectedProjectId: string | null;

setProjects: (
projects: readonly Project[],
) => void;

setSelectedProject: (
projectId: string,
) => void;

getSelectedProject: () => Project | null;
}

export const useProjectStore =
create<ProjectState>()(
persist(
(set, get) => ({
projects: [],
selectedProjectId: null,

    setProjects: (projects) => {
      set((state) => {
        const selectedProjectExists =
          state.selectedProjectId !== null &&
          projects.some(
            (project) =>
              project.id ===
              state.selectedProjectId,
          );

        return {
          projects,
          selectedProjectId:
            selectedProjectExists
              ? state.selectedProjectId
              : projects[0]?.id ?? null,
        };
      });
    },

    setSelectedProject: (
      projectId,
    ) => {
      const projectExists =
        get().projects.some(
          (project) =>
            project.id === projectId,
        );

      if (!projectExists) {
        return;
      }

      set({
        selectedProjectId: projectId,
      });
    },

    getSelectedProject: () => {
      const {
        projects,
        selectedProjectId,
      } = get();

      return (
        projects.find(
          (project) =>
            project.id ===
            selectedProjectId,
        ) ?? null
      );
    },
  }),
  {
    name: "mercy:project-store",
    partialize: (state) => ({
      selectedProjectId:
        state.selectedProjectId,
    }),
  },
),

);
