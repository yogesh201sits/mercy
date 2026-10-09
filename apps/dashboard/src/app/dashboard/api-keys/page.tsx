import { auth } from "@clerk/nextjs/server";

import {
  listApiKeys,
  listProjects,
} from "@/lib/mercy-api";
import { resolveProject } from "@/lib/dashboard-project";

import { CreateApiKeyForm } from "@/components/dashboard/create-api-key-form";
import { ApiKeyList } from "@/components/dashboard/api-key-list";
import { CreateProjectForm } from "@/components/dashboard/create-project-form";

interface ApiKeysPageProps {
  searchParams: Promise<{
    project?: string;
  }>;
}

export default async function ApiKeysPage({
  searchParams,
}: ApiKeysPageProps) {
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    throw new Error(
      "Unable to authenticate with Mercy API.",
    );
  }

  const projects = await listProjects(token);
  const params = await searchParams;
  const project = resolveProject(
    projects,
    params.project,
  );

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <CreateProjectForm />
      </div>
    );
  }

  const projectId = project.id;

  const apiKeys = await listApiKeys(
    projectId,
    token,
  );

  const activeKeys = apiKeys.filter(
    (key) => !key.revokedAt,
  );

  const revokedKeys = apiKeys.filter(
    (key) => key.revokedAt,
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      {/* Technical grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Subtle system glow */}
      <div
        className="pointer-events-none absolute -top-40 right-[-120px] h-[420px] w-[420px] rounded-full opacity-[0.08] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #39FF14 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="border-b border-black/10 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
            Access
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em]">
                API Keys
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
                Credentials used by agents and runtime clients
                to access this Mercy project.
              </p>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              project / {projectId}
            </div>
          </div>
        </div>

        {/* Summary */}
        <section className="mt-8">
          <div className="grid border-y border-black/10 bg-white sm:grid-cols-3">
            <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Total
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {apiKeys.length}
              </p>
            </div>

            <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Active
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {activeKeys.length}
              </p>
            </div>

            <div className="px-5 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                Revoked
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {revokedKeys.length}
              </p>
            </div>
          </div>
        </section>

        {/* Create */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
              Credentials
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Create key
            </h2>
          </div>

          <CreateApiKeyForm projectId={projectId} />
        </section>

        {/* Existing keys */}
        <section className="mt-10">
          <div className="flex items-end justify-between border-b border-black/10 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
                Credentials
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Project keys
              </h2>
            </div>
          </div>

          <div className="mt-4">
            <ApiKeyList
              projectId={projectId}
              apiKeys={apiKeys}
            />
          </div>
        </section>
      </div>
    </div>
  );
}