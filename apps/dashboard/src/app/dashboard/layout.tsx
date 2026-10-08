import type { ReactNode } from "react";

import { Sidebar, Topbar } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black">
      <Sidebar />

      <div className="min-h-screen lg:pl-60">
        <Topbar />

        <main className="min-h-[calc(100vh-4rem)] bg-[#F7F7F7]">
          {children}
        </main>
      </div>
    </div>
  );
}