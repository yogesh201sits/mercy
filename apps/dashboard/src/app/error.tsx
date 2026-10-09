"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] p-6 text-black">
      <div className="w-full max-w-md border border-black bg-white">
        <div className="border-b border-black bg-black px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#39FF14]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white">
              Application error
            </span>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-lg font-semibold tracking-tight">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-6 text-black/50">
            Mercy encountered an unexpected application error. Try again or
            reload the application.
          </p>

          {error.message && (
            <div className="mt-4 border border-black/10 bg-[#F7F7F7] px-3 py-2">
              <p className="break-words font-mono text-[10px] leading-5 text-black/50">
                {error.message}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="mt-6 border border-black bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}