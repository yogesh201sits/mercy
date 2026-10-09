import { auth } from "@clerk/nextjs/server";

import {
listProjects,
} from "@/lib/mercy-api";

import {
ProjectProvider,
} from "@/components/dashboard/project-provider";

import {
Sidebar,
} from "@/components/dashboard/sidebar";

import {
Topbar,
} from "@/components/dashboard/topbar";

export default async function DashboardLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
const { getToken } = await auth();

const token = await getToken();

if (!token) {
throw new Error(
"Unable to authenticate with Mercy API.",
);
}

const projects =
await listProjects(token);

return ( <ProjectProvider
   projects={projects}
 > <div className="min-h-screen bg-white"> <Sidebar />

    <div className="lg:pl-64">
      <Topbar />

      <main>
        {children}
      </main>
    </div>
  </div>
</ProjectProvider>

);
}
