"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

const technologies = ["TypeScript", "Bun", "REST API"];

const codeContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.25,
    },
  },
};

const codeLine: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

export function Developer() {
  const shouldReduceMotion = useReducedMotion();

  const reveal: Variants = shouldReduceMotion
    ? {
        hidden: {
          opacity: 1,
        },
        visible: {
          opacity: 1,
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: 30,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      };

  const slideLeft: Variants = shouldReduceMotion
    ? {
        hidden: {
          opacity: 1,
        },
        visible: {
          opacity: 1,
        },
      }
    : {
        hidden: {
          opacity: 0,
          x: -40,
        },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      };

  const slideRight: Variants = shouldReduceMotion
    ? {
        hidden: {
          opacity: 1,
        },
        visible: {
          opacity: 1,
        },
      }
    : {
        hidden: {
          opacity: 0,
          x: 50,
          rotateX: 5,
          rotateY: -3,
        },
        visible: {
          opacity: 1,
          x: 0,
          rotateX: 0,
          rotateY: 0,
          transition: {
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      };

  return (
    <section
      id="developers"
      className="relative overflow-hidden border-b border-black/10"
    >
      {/* =========================================================
          BACKGROUND GRID
      ========================================================== */}

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          animate={{
            backgroundPosition: ["0px 0px", "40px 40px"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          {/* =====================================================
              LEFT CONTENT
          ====================================================== */}

          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.25,
            }}
          >
            {/* Eyebrow */}

            <motion.div
              className="flex items-center gap-3"
              variants={reveal}
            >
              <motion.span
                className="h-px w-8 bg-black"
                initial={{
                  width: 0,
                }}
                whileInView={{
                  width: 32,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: "easeOut",
                }}
              />

              <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
                Developer experience
              </p>
            </motion.div>

            {/* Heading */}

            <motion.h2
              className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl"
              variants={reveal}
            >
              Add reversibility
              <br />
              without rebuilding
              <br />
              your agent.
            </motion.h2>

            {/* Description */}

            <motion.p
              className="mt-6 max-w-lg text-lg leading-8 text-black/60"
              variants={reveal}
            >
              Use the Mercy SDK with a local runtime or connect to the Mercy
              API. Your agent keeps its existing workflow while Mercy handles
              the action lifecycle.
            </motion.p>

            {/* Technology pills */}

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              variants={reveal}
            >
              {technologies.map((technology, index) => (
                <motion.span
                  key={technology}
                  className="border border-black px-3 py-1.5 font-mono text-xs"
                  initial={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                          y: 0,
                        }
                      : {
                          opacity: 0,
                          y: 12,
                        }
                  }
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion
                      ? 0
                      : 0.35 + index * 0.1,
                    ease: "easeOut",
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -3,
                          backgroundColor: "#050505",
                          color: "#ffffff",
                          transition: {
                            duration: 0.2,
                          },
                        }
                  }
                >
                  {technology}
                </motion.span>
              ))}
            </motion.div>

            {/* Runtime indicator */}

            <motion.div
              className="mt-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-black/30"
              variants={reveal}
            >
              <span className="relative flex h-2 w-2">
                {!shouldReduceMotion && (
                  <motion.span
                    className="absolute inline-flex h-full w-full bg-[#39FF14]"
                    animate={{
                      scale: [1, 2.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}

                <span className="relative h-2 w-2 bg-[#39FF14]" />
              </span>

              Runtime protection active
            </motion.div>
          </motion.div>

          {/* =====================================================
              RIGHT CODE WINDOW
          ====================================================== */}

          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.2,
            }}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -6,
                    transition: {
                      duration: 0.35,
                      ease: "easeOut",
                    },
                  }
            }
            style={{
              perspective: 1200,
            }}
          >
            <div className="relative">
              {/* Green ambient glow */}

              {!shouldReduceMotion && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-4 bg-[#39FF14]/10 blur-3xl"
                  animate={{
                    opacity: [0.15, 0.28, 0.15],
                    scale: [0.98, 1.02, 0.98],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Terminal */}

              <div className="relative border border-black bg-[#050505] text-white shadow-2xl shadow-black/10">
                {/* =================================================
                    TERMINAL HEADER
                ================================================== */}

                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="h-2 w-2 bg-[#39FF14]"
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : {
                              opacity: [1, 0.35, 1],
                              scale: [1, 0.85, 1],
                            }
                      }
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    <span className="font-mono text-xs text-white/60">
                      agent.ts
                    </span>
                  </div>

                  <motion.span
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: [0.3, 0.65, 0.3],
                          }
                    }
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Mercy SDK
                  </motion.span>
                </div>

                {/* =================================================
                    CODE
                ================================================== */}

                <motion.pre
                  className="overflow-x-auto p-6 font-mono text-xs leading-7 sm:text-sm"
                  variants={codeContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.3,
                  }}
                >
                  <code>
                    <motion.span variants={codeLine}>
                      <span className="text-white/40">
                        {"import "}
                      </span>

                      <span className="text-[#39FF14]">
                        {"{ MercyClient }"}
                      </span>

                      <span className="text-white/40">
                        {" from "}
                      </span>

                      <span className="text-white">
                        {'"@mercy/sdk"'}
                      </span>

                      <span className="text-white/40">
                        {";"}
                      </span>
                    </motion.span>

                    {"\n\n"}

                    <motion.span variants={codeLine}>
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
                    </motion.span>

                    {"\n\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/40">
                        {"const result = await "}
                      </span>

                      <span className="text-[#39FF14]">
                        {"mercy.execute"}
                      </span>

                      <span className="text-white/50">
                        {"({"}
                      </span>
                    </motion.span>

                    {"\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/50">
                        {"  projectId: "}
                      </span>

                      <span className="text-white">
                        {'"agent-prod"'}
                      </span>

                      <span className="text-white/50">
                        {","}
                      </span>
                    </motion.span>

                    {"\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/50">
                        {"  type: "}
                      </span>

                      <span className="text-white">
                        {'"update"'}
                      </span>

                      <span className="text-white/50">
                        {","}
                      </span>
                    </motion.span>

                    {"\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/50">
                        {"  target: "}
                      </span>

                      <span className="text-white">
                        {'"users/182"'}
                      </span>
                    </motion.span>

                    {"\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/50">
                        {"});"}
                      </span>
                    </motion.span>

                    {"\n\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-white/40">
                        {"// Later, if something goes wrong:"}
                      </span>
                    </motion.span>

                    {"\n"}

                    <motion.span variants={codeLine}>
                      <span className="text-[#39FF14]">
                        {"await mercy.undo"}
                      </span>

                      <span className="text-white/50">
                        {"(result.actionId);"}
                      </span>
                    </motion.span>

                    {"\n"}

                    {/* Cursor */}

                    {!shouldReduceMotion && (
                      <motion.span
                        className="inline-block h-4 w-[7px] translate-y-1 bg-[#39FF14]"
                        animate={{
                          opacity: [1, 0, 1],
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}
                  </code>
                </motion.pre>

                {/* =================================================
                    ACTION STATUS
                ================================================== */}

                <motion.div
                  className="grid border-t border-white/10 sm:grid-cols-3"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                  }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.12,
                        delayChildren: 0.5,
                      },
                    },
                  }}
                >
                  <StatusCard
                    label="Snapshot"
                    value="captured"
                    accent
                    shouldReduceMotion={shouldReduceMotion}
                  />

                  <StatusCard
                    label="Action"
                    value="completed"
                    shouldReduceMotion={shouldReduceMotion}
                  />

                  <StatusCard
                    label="Recovery"
                    value="available"
                    shouldReduceMotion={shouldReduceMotion}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ===============================================================
   STATUS CARD
================================================================ */

function StatusCard({
  label,
  value,
  accent = false,
  shouldReduceMotion,
}: {
  label: string;
  value: string;
  accent?: boolean;
  shouldReduceMotion: boolean | null;
}) {
  const variants: Variants = {
    hidden: shouldReduceMotion
      ? {
          opacity: 1,
          y: 0,
        }
      : {
          opacity: 0,
          y: 12,
        },

    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className="border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
      variants={variants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              backgroundColor: "rgba(255,255,255,0.035)",
            }
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {accent && (
          <motion.span
            className="h-1.5 w-1.5 bg-[#39FF14]"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [1, 0.35, 1],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <p
          className={`text-sm ${
            accent ? "text-[#39FF14]" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}