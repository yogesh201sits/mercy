"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

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
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-white px-6 lg:px-8">
      {/* Page title */}
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>
      </div>

      {/* Runtime / project / user */}
      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-1.5 w-1.5 bg-[#39FF14]" />

          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">
            API connected
          </span>
        </div>

        <div className="h-7 w-px bg-black/10" />

        <button
          type="button"
          className="flex h-8 items-center gap-2 border border-black/10 px-3 text-xs font-medium transition-colors hover:border-black/30"
        >
          <span className="h-1.5 w-1.5 bg-[#39FF14]" />
          default
        </button>

        <div className="h-7 w-px bg-black/10" />

        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}