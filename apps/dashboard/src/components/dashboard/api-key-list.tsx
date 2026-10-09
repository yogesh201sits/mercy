"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
MercyApiError,
revokeApiKey,
type ApiKey,
} from "@/lib/mercy-api";

interface ApiKeyListProps {
readonly projectId: string;
readonly apiKeys: readonly ApiKey[];
}

function formatDate(
value: string,
): string {
return new Date(value).toLocaleDateString(
"en-US",
{
year: "numeric",
month: "short",
day: "numeric",
},
);
}

export function ApiKeyList({
projectId,
apiKeys,
}: ApiKeyListProps) {
const { getToken } = useAuth();
const router = useRouter();

const [revokingKeyId, setRevokingKeyId] =
useState<string | null>(null);

const [error, setError] =
useState<string | null>(null);

async function handleRevoke(
keyId: string,
) {
const confirmed =
window.confirm(
"Revoke this API key? Agents using it will immediately lose access.",
);

if (!confirmed) {
  return;
}

setRevokingKeyId(keyId);
setError(null);

try {
  const token =
    await getToken();

  if (!token) {
    throw new Error(
      "Unable to authenticate with Mercy API.",
    );
  }

  await revokeApiKey(
    projectId,
    keyId,
    token,
  );

  router.refresh();
} catch (error) {
  if (
    error instanceof MercyApiError
  ) {
    setError(error.message);
  } else if (
    error instanceof Error
  ) {
    setError(error.message);
  } else {
    setError(
      "Failed to revoke API key.",
    );
  }
} finally {
  setRevokingKeyId(null);
}

}

if (apiKeys.length === 0) {
return ( <div className="border-y border-black/10 bg-white px-5 py-12 text-center"> <p className="text-sm font-medium">
No API keys yet </p>

    <p className="mt-2 text-xs text-black/40">
      Create a key to authenticate an agent with this
      project.
    </p>
  </div>
);

}

return ( <div>
{error ? ( <div className="mb-4 border border-black/10 px-4 py-3 text-xs text-black/60">
{error} </div>
) : null}

  <div className="overflow-hidden border-y border-black/10 bg-white">
    <div className="hidden grid-cols-[1.2fr_1.3fr_0.7fr_0.9fr_100px] border-b border-black/10 px-5 py-3 lg:grid">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
        Name
      </p>

      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
        Key
      </p>

      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
        Status
      </p>

      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
        Created
      </p>

      <span />
    </div>

    {apiKeys.map((key) => {
      const revoked =
        Boolean(key.revokedAt);

      const revoking =
        revokingKeyId === key.id;

      return (
        <div
          key={key.id}
          className="border-b border-black/10 px-5 py-5 last:border-b-0"
        >
          <div className="hidden items-center lg:grid lg:grid-cols-[1.2fr_1.3fr_0.7fr_0.9fr_100px]">
            <div>
              <p className="text-sm font-medium">
                {key.name}
              </p>

              <p className="mt-1 font-mono text-[9px] text-black/30">
                {key.id}
              </p>
            </div>

            <p className="font-mono text-xs text-black/55">
              {key.keyPrefix}••••••••
            </p>

            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 ${
                  revoked
                    ? "bg-black/20"
                    : "bg-[#39FF14]"
                }`}
              />

              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/55">
                {revoked
                  ? "revoked"
                  : "active"}
              </span>
            </div>

            <p className="font-mono text-[10px] text-black/35">
              {formatDate(
                key.createdAt,
              )}
            </p>

            {!revoked ? (
              <button
                type="button"
                disabled={revoking}
                onClick={() =>
                  void handleRevoke(
                    key.id,
                  )
                }
                className="justify-self-end font-mono text-[9px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black disabled:opacity-30"
              >
                {revoking
                  ? "Revoking..."
                  : "Revoke"}
              </button>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {key.name}
                </p>

                <p className="mt-1 font-mono text-[9px] text-black/30">
                  {key.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 ${
                    revoked
                      ? "bg-black/20"
                      : "bg-[#39FF14]"
                  }`}
                />

                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/55">
                  {revoked
                    ? "revoked"
                    : "active"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 border-t border-black/10 pt-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                  Key
                </p>

                <p className="mt-2 font-mono text-xs text-black/55">
                  {key.keyPrefix}••••••••
                </p>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                  Created
                </p>

                <p className="mt-2 font-mono text-xs text-black/55">
                  {formatDate(
                    key.createdAt,
                  )}
                </p>
              </div>
            </div>

            {!revoked ? (
              <button
                type="button"
                disabled={revoking}
                onClick={() =>
                  void handleRevoke(
                    key.id,
                  )
                }
                className="mt-4 border-t border-black/10 pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-black/40 transition-colors hover:text-black disabled:opacity-30"
              >
                {revoking
                  ? "Revoking..."
                  : "Revoke key"}
              </button>
            ) : null}
          </div>
        </div>
      );
    })}
  </div>
</div>

);
}
