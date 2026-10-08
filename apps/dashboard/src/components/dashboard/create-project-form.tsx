"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  createProject,
} from "@/lib/mercy-api";

export function CreateProjectForm() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Project name must be 100 characters or fewer.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          "Unable to authenticate with Mercy.",
        );
      }

      const project =
        await createProject(
          {
            name: trimmedName,
          },
          token,
        );

      localStorage.setItem(
        "mercy:selected-project",
        project.id,
      );

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md border border-black/10 bg-white"
    >
      <div className="border-b border-black/10 px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/40">
          Project setup
        </p>

        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
          Create your first project
        </h2>

        <p className="mt-2 text-sm leading-6 text-black/50">
          Projects separate your agent actions,
          recovery state, and API keys.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <label
            htmlFor="project-name"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/50"
          >
            Project name
          </label>

          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="My AI Agent"
            maxLength={100}
            disabled={loading}
            className="mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black disabled:cursor-not-allowed disabled:bg-black/[0.03]"
          />
        </div>

        {error ? (
          <div className="border border-black/15 bg-black/[0.03] px-3 py-2.5 text-sm text-black/70">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center border border-black bg-black text-sm font-medium text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating project..."
            : "Create project"}
        </button>
      </div>
    </form>
  );
}