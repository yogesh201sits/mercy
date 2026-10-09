import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { listProjects } from "@/lib/mercy-api";

import { CreateProjectForm } from "@/components/dashboard/create-project-form";

export default async function CreateProjectPage() {
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    throw new Error(
      "Unable to authenticate with Mercy API.",
    );
  }

  const projects = await listProjects(token);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
      <div className="border-b border-black/10 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
          Workspace
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Create project
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
          Create a project to isolate your agents,
          actions, API keys, and recovery history.
        </p>
      </div>

      <section className="mt-8">
        <CreateProjectForm />
      </section>

      {projects.length > 0 ? (
        <section className="mt-8 border-t border-black/10 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            Existing projects
          </p>

          <div className="mt-4 space-y-1">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between border-b border-black/10 px-1 py-3"
              >
                <span className="text-sm">
                  {project.name}
                </span>

                <span className="font-mono text-[9px] text-black/30">
                  {project.id}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}