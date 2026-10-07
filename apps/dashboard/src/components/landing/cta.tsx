export function Cta() {
  return (
    <section id="docs" className="border-b border-black/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#39FF14]">
            Start building
          </p>

          <h2 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Give your agents
            <br />
            a way back.
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-8 text-white/50">
            Build reversible actions into your agent runtime with
            Mercy.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center bg-[#39FF14] px-6 text-sm font-semibold text-black transition-opacity hover:opacity-80"
            >
              Get started
            </a>

            <a
              href="#developers"
              className="inline-flex h-12 items-center justify-center border border-white/20 px-6 text-sm font-medium text-white transition-colors hover:border-white/50"
            >
              Read the docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}