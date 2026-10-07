export function Problem() {
  return (
    <section className="border-b border-black/10">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
              The problem
            </p>

            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[1] tracking-[-0.035em] sm:text-5xl">
              Agents can act.
              <br />
              They can't always
              <br />
              <span className="bg-[#39FF14] px-1">
                take it back.
              </span>
            </h2>
          </div>

          <div className="max-w-2xl">
            <p className="text-xl leading-8 text-black/70">
              AI agents are becoming capable of changing files,
              modifying databases, calling APIs, and operating
              production systems.
            </p>

            <p className="mt-6 text-xl leading-8 text-black/70">
              But when an action goes wrong, most systems leave
              recovery to the application developer.
            </p>

            <div className="mt-10 border-l-2 border-[#39FF14] pl-6">
              <p className="text-lg font-medium leading-8">
                Mercy gives supported agent actions a defined path
                back to their previous state.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 grid border-y border-black/10 sm:grid-cols-3">
          <div className="border-b border-black/10 px-0 py-8 sm:border-b-0 sm:border-r sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-black/40">
              Without Mercy
            </p>

            <p className="mt-4 text-lg font-medium">
              Agent changes state
            </p>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Recovery becomes application-specific.
            </p>
          </div>

          <div className="border-b border-black/10 px-0 py-8 sm:border-b-0 sm:border-r sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-black/40">
              With Mercy
            </p>

            <p className="mt-4 text-lg font-medium">
              State is captured first
            </p>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Supported actions have a known recovery path.
            </p>
          </div>

          <div className="px-0 py-8 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-black/40">
              When things change
            </p>

            <p className="mt-4 text-lg font-medium">
              Verify before undo
            </p>

            <p className="mt-2 text-sm leading-6 text-black/50">
              Conflicting state is detected instead of blindly restored.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}