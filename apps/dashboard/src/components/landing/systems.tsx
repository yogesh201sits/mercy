const systems = [
  {
    index: "01",
    name: "Filesystem",
    target: "files",
    description:
      "Capture and restore files and directories with path validation and state verification.",
    examples: ["create", "update", "delete", "rename", "move"],
  },
  {
    index: "02",
    name: "PostgreSQL",
    target: "postgres",
    description:
      "Protect database changes with snapshots, deterministic state checks, and reversible operations.",
    examples: ["delete_rows", "update_rows"],
  },
  {
    index: "03",
    name: "Custom",
    target: "your-system",
    description:
      "Wrap your own tools and external systems with Mercy's universal adapter contract.",
    examples: ["API", "tool", "service", "workflow"],
  },
];

export function Systems() {
  return (
    <section className="border-b border-black/10">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
              Supported systems
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              One runtime.
              <br />
              Different systems.
            </h2>
          </div>

          <p className="max-w-md text-lg leading-8 text-black/60">
            Mercy uses adapters to define how state is captured, changed,
            verified, and restored for each system.
          </p>
        </div>

        <div className="mt-20 grid border-t border-black/10 lg:grid-cols-3">
          {systems.map((system) => (
            <article
              key={system.name}
              className="group border-b border-black/10 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-black/40">
                  {system.index}
                </span>

                <span className="font-mono text-xs text-black/40">
                  adapter
                </span>
              </div>

              <div className="mt-12">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 bg-[#39FF14]" />

                  <h3 className="text-2xl font-semibold tracking-tight">
                    {system.name}
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-6 text-black/60">
                  {system.description}
                </p>
              </div>

              <div className="mt-8 border border-black/10 bg-[#F7F7F7] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/40">
                  Target
                </p>

                <p className="mt-2 font-mono text-sm">
                  {system.target}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {system.examples.map((example) => (
                  <span
                    key={example}
                    className="border border-black/10 px-2.5 py-1 font-mono text-[10px] text-black/50"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}