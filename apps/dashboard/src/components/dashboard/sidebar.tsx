"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
  },
  {
    label: "Actions",
    href: "/dashboard/actions",
  },
  {
    label: "Groups",
    href: "/dashboard/groups",
  },
  {
    label: "Systems",
    href: "/dashboard/systems",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-white/10 bg-[#050505] text-white lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="h-2 w-2 bg-[#39FF14]" />
          mercy
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col px-3 py-6">
        <div className="px-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            Workspace
          </p>
        </div>

        <nav className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 items-center gap-3 border-l-2 px-3 text-sm transition-colors ${
                  active
                    ? "border-[#39FF14] bg-white/5 text-white"
                    : "border-transparent text-white/45 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 ${
                    active ? "bg-[#39FF14]" : "bg-white/20"
                  }`}
                />

                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Runtime status */}
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="px-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
              Runtime
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 bg-[#39FF14]" />

              <span className="text-xs text-white/60">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}