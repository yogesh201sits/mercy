"use client";

import { useEffect, useRef } from "react";

export function Cta() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;

    if (!section || !content) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Progress starts when CTA section reaches bottom of viewport.
      const progress = Math.min(
        1,
        Math.max(
          0,
          (viewportHeight - rect.top) /
            (section.offsetHeight - viewportHeight)
        )
      );

      // CTA begins completely below the viewport.
      const translateY = 100 - progress * 100;

      content.style.transform = `translateY(${translateY}%)`;
    };

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="docs"
      className="relative h-[200vh] bg-[#050505]"
    >
      {/* Viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* CTA starts below the viewport */}
        <div
          ref={contentRef}
          className="absolute inset-0 flex min-h-screen items-center will-change-transform"
          style={{
            transform: "translateY(100%)",
          }}
        >
          <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
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

              {/* Brand */}
              <div className="flex items-start justify-start lg:items-center lg:justify-center">
                <a
                  href="/"
                  className="group inline-flex items-center lg:gap-15"
                >
                  <img
                    src="/logo.png"
                    alt="Mercy"
                    className="h-16 w-24 scale-150 object-contain drop-shadow-[0.5px_1px_0_rgb(0_0_0_/_35%)] lg:scale-400"
                  />

                  <span className="font-[var(--font-inter-tight)] text-3xl font-semibold tracking-[-0.045em] text-amber-50 lg:text-8xl">
                    mercy
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}