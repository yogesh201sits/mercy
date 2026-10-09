"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  createApiKey,
  MercyApiError,
} from "@/lib/mercy-api";

interface CreateApiKeyFormProps {
  readonly projectId: string;
}

export function CreateApiKeyForm({
  projectId,
}: CreateApiKeyFormProps) {
  const { getToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("API key name is required");
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

      const created = await createApiKey(
        projectId,
        { name: trimmedName },
        token,
      );

      setSecret(created.secret);
      setName("");

      router.refresh();
    } catch (error) {
      setError(
        error instanceof MercyApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to create API key.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function copySecret() {
    if (!secret) {
      return;
    }

    await navigator.clipboard.writeText(secret);
  }

  function handleDone() {
    setSecret(null);
  }

  if (secret) {
    return (
      <div className="border border-black/10 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
          API key created
        </p>

        <h3 className="mt-2 text-sm font-semibold">
          Save your secret
        </h3>

        <p className="mt-2 text-xs leading-5 text-black/50">
          Mercy will not show the full secret again.
          Store it somewhere secure.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <code className="min-w-0 flex-1 break-all border border-black/10 bg-black/[0.02] px-3 py-3 font-mono text-xs">
            {secret}
          </code>

          <button
            type="button"
            onClick={copySecret}
            className="border border-black px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
          >
            Copy
          </button>
        </div>

        <button
          type="button"
          onClick={handleDone}
          className="mt-4 border border-black/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-black/60 transition-colors hover:border-black hover:text-black"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-black/10 p-5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
        Create API key
      </p>

      <h3 className="mt-2 text-sm font-semibold">
        Add a runtime key
      </h3>

      <p className="mt-2 text-xs leading-5 text-black/50">
        Use this key to authenticate Mercy runtime
        requests for this project.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="e.g. production-agent"
          maxLength={100}
          disabled={creating}
          className="h-10 flex-1 border border-black/10 px-3 font-mono text-xs outline-none placeholder:text-black/25 focus:border-black"
        />

        <button
          type="submit"
          disabled={creating}
          className="h-10 border border-black bg-black px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-opacity hover:bg-[#39FF14] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create key"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 font-mono text-[10px] text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}