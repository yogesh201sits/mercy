"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Scrolling behavior is exclusive to the homepage.
    if (!mounted || !isHome) {
      setScrolled(false);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };


  }, [mounted, isHome]);

  const floating = mounted && isHome && scrolled;

  return (
    <motion.nav
      initial={false}
      animate={{
        width: floating ? "min(92%, 900px)" : "100%",
        marginTop: floating ? 12 : 0,
        borderRadius: floating ? 9999 : 0,
        boxShadow: floating
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
        className={`mx-auto flex items-center justify-between px-6 transition-[height] duration-300 lg:px-8 ${floating ? "h-14" : "h-16"
          }`}
      >
        {/* Brand */} <a href="/" className="flex shrink-0 items-center"> <img
          src="/logo.png"
          alt="Mercy"
          width={64}
          height={40}
          className="h-10 w-16 scale-150 object-contain drop-shadow-[0.5px_1px_0_rgb(0_0_0_/_35%)]"
        />

          <span className="font-[var(--font-inter-tight)] text-[22px] font-semibold tracking-[-0.045em]">
            mercy   
            {/* <span className="relative -top-[2px] ml-[1px] inline-block text-3xl leading-none  tracking-normal text-[#26ff00]">.</span> */}
          </span>

        </a>

        {/* Navigation */}
        <motion.div
          animate={{
            opacity: floating ? 0 : 1,
            width: floating ? 0 : "auto",
          }}
          transition={{ duration: 0.2 }}
          className="hidden items-center gap-8 overflow-hidden text-sm md:flex"
          aria-hidden={floating}
          inert={floating}
        >
          <a
            href="/#how-it-works"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            How it works
          </a>

          <a
            href="/#developers"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            Developers
          </a>

          <a
            href="/docs"
            className="whitespace-nowrap transition-opacity hover:opacity-60"
          >
            Docs
          </a>
        </motion.div>

        {/* Authentication */}
        <div className="flex shrink-0 items-center gap-2">
          {!mounted || !isLoaded ? (
            // Stable placeholder during SSR and initial hydration.
            <div className="h-9 w-[148px]" aria-hidden="true" />
          ) : isSignedIn ? (
            <>
              <a
                href="/dashboard"
                className="border border-black bg-black px-4 py-2 text-sm font-medium text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
              >
                Dashboard
              </a>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:border-black/30"
                >
                  Sign in
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="border border-black bg-black px-4 py-2 text-sm font-medium text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
                >
                  Sign up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </motion.nav>

  );
}
