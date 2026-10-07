"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };


    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };


  }, []);

  return (
    <motion.nav
      initial={false}
      animate={{
        width: scrolled ? "min(92%, 900px)" : "100%",
        marginTop: scrolled ? 12 : 0,
        borderRadius: scrolled ? 9999 : 0,
        boxShadow: scrolled
          ? "0 8px 24px rgba(0, 0, 0, 0.10)"
          : "0 0 0 rgba(0, 0, 0, 0)",
      }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="sticky top-0 z-50 mx-auto border border-black/10 bg-white"
    >
      <div
        className={`mx-auto flex items-center justify-between px-6 transition-all duration-300 lg:px-8 ${scrolled ? "h-14" : "h-16"
          }`}
      >
        {/* Brand */} 
        <a href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Mercy"
            className="h-10 w-16 scale-150 object-contain drop-shadow-[0.5px_1px_0_rgb(0_0_0_/_35%)]"
          />

          <span className="font-[var(--font-inter-tight)] text-[22px] font-semibold tracking-[-0.045em]">
            mercy
          </span>
        </a>

        {/* Navigation */}
        <motion.div
          animate={{
            opacity: scrolled ? 0 : 1,
            width: scrolled ? 0 : "auto",
          }}
          transition={{ duration: 0.2 }}
          className="hidden items-center gap-8 overflow-hidden text-sm md:flex"
        >
          <a
            href="#how-it-works"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            How it works
          </a>

          <a
            href="#developers"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            Developers
          </a>

          <a
            href="#docs"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            Docs
          </a>
        </motion.div>

        {/* CTA */}
        <motion.a
          href="/dashboard"
          animate={{
            paddingLeft: scrolled ? 14 : 16,
            paddingRight: scrolled ? 14 : 16,
            paddingTop: scrolled ? 7 : 8,
            paddingBottom: scrolled ? 7 : 8,
          }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="border border-black bg-black text-sm font-medium text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
        >
          Get started
        </motion.a>
      </div>
    </motion.nav>


  );
}
