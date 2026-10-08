export function Cta() {
  return (
    <section id="docs" className="border-b border-black/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr]">
          {/* CTA */}
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
              Build reversible actions into your agent runtime with Mercy.
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

          {/* Right side brand */}
          <div className="flex items-start justify-start lg:items-center lg:justify-center">
            <a
              href="/"
              className="group inline-flex items-center lg:gap-15"
            >
              <img
                src="/logo.png"
                alt="Mercy"
                className="h-16 w-24 scale-150 lg:scale-400 object-contain drop-shadow-[0.5px_1px_0_rgb(0_0_0_/_35%)]"
              />

              <span className="font-[var(--font-inter-tight)] lg:text-8xl text-3xl font-semibold tracking-[-0.045em] text-amber-50">
                mercy
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}