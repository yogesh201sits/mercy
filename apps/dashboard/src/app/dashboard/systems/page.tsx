import { auth } from "@clerk/nextjs/server";

import { CreateProjectForm } from "@/components/dashboard/create-project-form";
import {
  listProjects,
} from "@/lib/mercy-api";
import { resolveProject } from "@/lib/dashboard-project";

interface SystemsPageProps {
  searchParams: Promise<{
    project?: string;
  }>;
}

const systems = [
  {
    name: "Filesystem",
    type: "filesystem",
    adapter: "@mercy/filesystem",
    status: "operational",
    actions: 72,
    recovery: "Available",
  },
  {
    name: "PostgreSQL",
    type: "postgres",
    adapter: "@mercy/postgres-adapter",
    status: "operational",
    actions: 41,
    recovery: "Available",
  },
  {
    name: "Payment Service",
    type: "custom",
    adapter: "@mercy/custom-adapter",
    status: "operational",
    actions: 15,
    recovery: "Available",
  },
];

function StatusBadge({ status }: { status: string }) {
  const operational = status === "operational";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 ${
          operational ? "bg-[#39FF14]" : "bg-black/20"
        }`}
      />

      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/55">
        {status}
      </span>
    </div>
  );
}

export default async function SystemsPage({
  searchParams,
}: SystemsPageProps) {
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
          Workspace
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              Systems
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
              Systems connected to Mercy through action adapters.
              Each adapter defines how state is captured, changed,
              verified, and recovered.
            </p>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            project / {project.id}
          </div>
        </div>
      </div>

      {/* Runtime summary */}
      <section className="mt-8">
        <div className="grid border-y border-black/10 bg-white sm:grid-cols-3">
          <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Connected systems
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              3
            </p>
          </div>

          <div className="border-b border-black/10 px-5 py-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Operational
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              3
            </p>
          </div>

          <div className="px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
              Protected actions
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              128
            </p>
          </div>
        </div>
      </section>

      {/* Systems */}
      <section className="mt-10">
        <div className="border-b border-black/10 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
            Connected adapters
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Recovery systems
          </h2>
        </div>

        <div className="mt-4 border-y border-black/10 bg-white">
          {/* Table header */}
          <div className="hidden grid-cols-[1.2fr_0.8fr_1.5fr_0.7fr_0.6fr_0.7fr] border-b border-black/10 px-5 py-3 lg:grid">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              System
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Type
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Adapter
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Status
            </p>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Actions
            </p>

            <p className="text-right font-mono text-[9px] uppercase tracking-[0.14em] text-black/35">
              Recovery
            </p>
          </div>

          {systems.map((system) => (
            <div
              key={system.name}
              className="border-b border-black/10 px-5 py-5 last:border-b-0"
            >
              {/* Desktop */}
              <div className="hidden items-center lg:grid lg:grid-cols-[1.2fr_0.8fr_1.5fr_0.7fr_0.6fr_0.7fr]">
                <div>
                  <p className="text-sm font-medium">
                    {system.name}
                  </p>

                  <p className="mt-1 font-mono text-[9px] text-black/30">
                    connected
                  </p>
                </div>

                <p className="font-mono text-xs text-black/50">
                  {system.type}
                </p>

                <p className="font-mono text-[10px] text-black/50">
                  {system.adapter}
                </p>

                <StatusBadge status={system.status} />

                <p className="font-mono text-xs text-black/55">
                  {system.actions}
                </p>

                <p className="text-right font-mono text-[10px] text-black/50">
                  {system.recovery}
                </p>
              </div>

              {/* Mobile */}
              <div className="lg:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {system.name}
                    </p>

                    <p className="mt-1 font-mono text-[9px] text-black/30">
                      {system.adapter}
                    </p>
                  </div>

                  <StatusBadge status={system.status} />
                </div>

                <div className="mt-5 grid grid-cols-3 border-t border-black/10 pt-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                      Type
                    </p>

                    <p className="mt-2 font-mono text-xs text-black/55">
                      {system.type}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                      Actions
                    </p>

                    <p className="mt-2 font-mono text-xs text-black/55">
                      {system.actions}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30">
                      Recovery
                    </p>

                    <p className="mt-2 font-mono text-xs text-black/55">
                      {system.recovery}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adapter model */}
      <section className="mt-12">
        <div className="border-b border-black/10 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
            Adapter model
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            How systems become reversible
          </h2>
        </div>

        <div className="mt-4 grid border-y border-black/10 bg-white md:grid-cols-4">
          {[
            {
              number: "01",
              title: "Prepare",
              description:
                "Identify the target and define the action before execution.",
            },
            {
              number: "02",
              title: "Snapshot",
              description:
                "Capture the state required to recover from the action.",
            },
            {
              number: "03",
              title: "Execute",
              description:
                "Apply the requested change through the connected system.",
            },
            {
              number: "04",
              title: "Undo",
              description:
                "Restore or compensate using the adapter's recovery strategy.",
            },
          ].map((item) => (
            <div
              key={item.number}
              className="border-b border-black/10 px-5 py-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <span className="font-mono text-[10px] text-black/30">
                {item.number}
              </span>

              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>

              <p className="mt-3 text-xs leading-5 text-black/50">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}