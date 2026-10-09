import Link from "next/link";

export function DocsFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-2"
          aria-label="Mercy home"
        >
          <img
            src="/logo.png"
            alt=""
            className="h-7 w-9 scale-250 object-contain"
          />

          <span className="font-[var(--font-inter)] text-lg font-semibold tracking-[-0.055em]">
            mercy
            <span className="text-[#39FF14]">.</span>
          </span>
        </Link>

        {/* Tagline */}
        <p className="text-sm leading-6 text-white/55">
          Because “my bad” isn’t a rollback strategy.
        </p>

        {/* Links */}
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
          <Link
            href="/docs"
            className="transition-colors hover:text-white"
          >
            Documentation
          </Link>

          <Link
            href="/dashboard"
            className="transition-colors hover:text-[#39FF14]"
          >
            Dashboard <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {/* <div className="">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 font-mono text-[10px] tracking-wide text-white/30 sm:flex-row sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Mercy</span>
          <span>Built for reversible actions.</span>
        </div>
      </div> */}
    </footer>
  );
}