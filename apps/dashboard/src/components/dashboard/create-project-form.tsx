
"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  createProject,
  MercyApiError,
} from "@/lib/mercy-api";

export function CreateProjectForm() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
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

    setCreating(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          "Unable to authenticate with Mercy API.",
        );
      }

      const project = await createProject(
        { name: trimmedName },
        token,
      );

      router.push(
        `/dashboard?project=${encodeURIComponent(project.id)}`,
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof MercyApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to create project.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-black/10 p-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
        New project
      </p>

      <h2 className="mt-2 text-sm font-semibold">
        Project details
      </h2>

      <p className="mt-2 text-xs leading-5 text-black/50">
        Projects isolate your agents, actions, API keys,
        and recovery history.
      </p>

      <div className="mt-5">
        <label
          htmlFor="project-name"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40"
        >
          Name
        </label>

        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="e.g. production"
          maxLength={100}
          disabled={creating}
          autoFocus
          className="mt-2 h-10 w-full border border-black/10 px-3 font-mono text-xs outline-none placeholder:text-black/25 focus:border-black"
        />
      </div>

      {error ? (
        <p className="mt-3 font-mono text-[10px] text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={creating}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={creating}
          className="h-10 border border-black bg-black px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#39FF14] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}