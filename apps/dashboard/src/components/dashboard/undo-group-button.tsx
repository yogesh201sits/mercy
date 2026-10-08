"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { undoGroup } from "@/lib/mercy-api";

interface UndoGroupButtonProps {
readonly groupId: string;
}

export function UndoGroupButton({
groupId,
}: UndoGroupButtonProps) {
const router = useRouter();

const [status, setStatus] = useState<
"idle" | "undoing" | "success" | "conflict" | "error"

> ("idle");

const [message, setMessage] = useState<string | null>(null);

async function handleUndo() {
setStatus("undoing");
setMessage(null);

try {
  const result = await undoGroup(groupId);

  if (result.conflict) {
    setStatus("conflict");
    setMessage(
      result.error ??
        "One or more actions changed after their snapshots were created.",
    );
    return;
  }

  if (!result.success) {
    setStatus("error");
    setMessage(
      result.error ?? "Unable to undo this group.",
    );
    return;
  }

  setStatus("success");
  setMessage("Group successfully undone.");
  router.refresh();
} catch (error) {
  setStatus("error");

  setMessage(
    error instanceof Error
      ? error.message
      : "Unable to undo this group.",
  );
}

}

const isUndoing = status === "undoing";

return ( <div>
<button
type="button"
onClick={handleUndo}
disabled={isUndoing || status === "success"}
className="border border-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
>
{isUndoing
? "Undoing..."
: status === "success"
? "Undone"
: "Undo group"} </button>

  {message && (
    <div
      className={`mt-3 border px-3 py-2 font-mono text-[10px] ${
        status === "success"
          ? "border-[#39FF14]/50 bg-[#39FF14]/10 text-black"
          : status === "conflict"
            ? "border-black/20 bg-black/[0.04] text-black/70"
            : "border-black/15 bg-white text-black/60"
      }`}
    >
      {message}
    </div>
  )}
</div>
);
}
