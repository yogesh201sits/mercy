export function Developer() {
  return (
    <section id="developers" className="border-b border-black/10">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
              Developer experience
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Add reversibility
              <br />
              without rebuilding
              <br />
              your agent.
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-black/60">
              Use the Mercy SDK with a local runtime or connect to the
              Mercy API. Your agent keeps its existing workflow while
              Mercy handles the action lifecycle.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="border border-black px-3 py-1.5 font-mono text-xs">
                TypeScript
              </span>

              <span className="border border-black px-3 py-1.5 font-mono text-xs">
                Bun
              </span>

              <span className="border border-black px-3 py-1.5 font-mono text-xs">
                REST API
              </span>
            </div>
          </div>

          <div className="border border-black bg-[#050505] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-[#39FF14]" />

                <span className="font-mono text-xs text-white/60">
                  agent.ts
                </span>
              </div>

              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                Mercy SDK
              </span>
            </div>

            <pre className="overflow-x-auto p-6 font-mono text-xs leading-7 sm:text-sm">
              <code>
                <span className="text-white/40">{"import "}</span>
                <span className="text-[#39FF14]">
                  {"{ MercyClient }"}
                </span>
                <span className="text-white/40">
                  {" from "}
                </span>
                <span className="text-white">
                  {'"@mercy/sdk"'}
                </span>
                <span className="text-white/40">{";"}</span>

                {"\n\n"}

                <span className="text-[#39FF14]">
                  {"const mercy"}
                </span>
                <span className="text-white/50">
                  {" = "}
                </span>
                <span className="text-white">
                  {"new MercyClient"}
                </span>
                <span className="text-white/50">
                  {"({ transport });"}
                </span>

                {"\n\n"}

                <span className="text-white/40">
                  {"const result = await "}
                </span>
                <span className="text-[#39FF14]">
                  {"mercy.execute"}
                </span>
                <span className="text-white/50">
                  {"({"}
                </span>

                {"\n"}

                <span className="text-white/50">
                  {"  projectId: "}
                </span>
                <span className="text-white">
                  {'"agent-prod"'}
                </span>
                <span className="text-white/50">
                  {","}
                </span>

                {"\n"}

                <span className="text-white/50">
                  {"  type: "}
                </span>
                <span className="text-white">
                  {'"update"'}
                </span>
                <span className="text-white/50">
                  {","}
                </span>

                {"\n"}

                <span className="text-white/50">
                  {"  target: "}
                </span>
                <span className="text-white">
                  {'"users/182"'}
                </span>

                {"\n"}

                <span className="text-white/50">
                  {"});"}
                </span>

                {"\n\n"}

                <span className="text-white/40">
                  {"// Later, if something goes wrong:"}
                </span>

                {"\n"}

                <span className="text-[#39FF14]">
                  {"await mercy.undo"}
                </span>
                <span className="text-white/50">
                  {'(result.actionId);'}
                </span>
              </code>
            </pre>

            <div className="grid border-t border-white/10 sm:grid-cols-3">
              <div className="border-b border-white/10 px-5 py-4 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                  Snapshot
                </p>

                <p className="mt-2 text-sm text-[#39FF14]">
                  captured
                </p>
              </div>

              <div className="border-b border-white/10 px-5 py-4 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                  Action
                </p>

                <p className="mt-2 text-sm text-white">
                  completed
                </p>
              </div>

              <div className="px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                  Recovery
                </p>

                <p className="mt-2 text-sm text-white">
                  available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}