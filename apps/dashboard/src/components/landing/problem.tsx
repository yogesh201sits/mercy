"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

const cards = [
  {
    label: "Without Mercy",
    title: "Agent changes state",
    description: "Recovery becomes application-specific.",
  },
  {
    label: "With Mercy",
    title: "State is captured first",
    description: "Supported actions have a known recovery path.",
  },
  {
    label: "When things change",
    title: "Verify before undo",
    description:
      "Conflicting state is detected instead of blindly restored.",
  },
];

const reveal: Variants = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const revealLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -45,
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

const revealRight: Variants = {
  hidden: {
    opacity: 0,
    x: 45,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      delay: 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const cardItem: Variants = {
  hidden: {
    opacity: 0,
    y: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function Problem() {
  const shouldReduceMotion = useReducedMotion();

  /*
   * Respect reduced-motion preferences while keeping
   * the same visual hierarchy.
   */
  const motionReveal: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : reveal;

  const motionRevealLeft: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : revealLeft;

  const motionRevealRight: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : revealRight;

  const motionCardContainer: Variants = shouldReduceMotion
    ? {
        hidden: {},
        visible: {},
      }
    : cardContainer;

  const motionCardItem: Variants = shouldReduceMotion
    ? {
        hidden: {
          opacity: 1,
          y: 0,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }
    : cardItem;

  return (
    <section className="relative overflow-hidden border-b border-black/10">
      {/* =========================================================
          SUBTLE BACKGROUND GRID
      ========================================================== */}

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          initial={{
            backgroundPosition: "0px 0px",
          }}
          whileInView={{
            backgroundPosition: "24px 24px",
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 8,
            ease: "linear",
          }}
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        {/* =======================================================
            MAIN CONTENT
        ======================================================== */}

        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          {/* LEFT */}

          <motion.div
            variants={motionRevealLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
          >
            {/* Eyebrow */}

            <div className="flex items-center gap-3">
              <motion.span
                className="h-px bg-black"
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
                  duration: 0.55,
                  delay: shouldReduceMotion ? 0 : 0.1,
                  ease: "easeOut",
                }}
              />

              <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
                The problem
              </p>
            </div>

            {/* Heading */}

            <motion.h2
              className="mt-5 max-w-md text-4xl font-semibold leading-[1] tracking-[-0.035em] sm:text-5xl"
              variants={motionReveal}
            >
              Agents can act.
              <br />
              They can't always
              <br />

              <span className="relative inline-block px-1">
                {/* Animated green highlight */}

                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[#39FF14]"
                  initial={
                    shouldReduceMotion
                      ? {
                          scaleX: 1,
                        }
                      : {
                          scaleX: 0,
                        }
                  }
                  whileInView={{
                    scaleX: 1,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.8,
                  }}
                  transition={{
                    duration: 0.65,
                    delay: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    originX: 0,
                  }}
                />

                <span className="relative">
                  take it back.
                </span>
              </span>
            </motion.h2>
          </motion.div>

          {/* RIGHT */}

          <motion.div
            className="max-w-2xl"
            variants={motionRevealRight}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
          >
            <motion.p
              className="text-xl leading-8 text-black/70"
              variants={motionReveal}
            >
              AI agents are becoming capable of changing files,
              modifying databases, calling APIs, and operating
              production systems.
            </motion.p>

            <motion.p
              className="mt-6 text-xl leading-8 text-black/70"
              variants={motionReveal}
            >
              But when an action goes wrong, most systems leave
              recovery to the application developer.
            </motion.p>

            {/* Mercy statement */}

            <motion.div
              className="relative mt-10 border-l-2 border-[#39FF14] pl-6"
              variants={motionReveal}
            >
              {/* Animated vertical signal */}

              {!shouldReduceMotion && (
                <motion.span
                  aria-hidden="true"
                  className="absolute -left-[3px] top-0 w-[4px] bg-[#39FF14]"
                  initial={{
                    height: 0,
                  }}
                  whileInView={{
                    height: "100%",
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.25,
                    ease: "easeOut",
                  }}
                />
              )}

              <p className="text-lg font-medium leading-8">
                Mercy gives supported agent actions a defined path
                back to their previous state.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* =======================================================
            STATE FLOW
        ======================================================== */}

        <motion.div
          className="relative mt-20 grid border-y border-black/10 sm:grid-cols-3"
          variants={motionCardContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.2,
          }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.label}
              variants={motionCardItem}
              className={[
                "group relative px-0 py-8",
                "border-b border-black/10",
                "sm:border-b-0 sm:px-8",
                index !== cards.length - 1
                  ? "sm:border-r"
                  : "",
              ].join(" ")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      backgroundColor: "rgba(0,0,0,0.018)",
                    }
              }
              transition={{
                duration: 0.2,
              }}
            >
              {/* Top index */}

              <div className="mb-6 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/30">
                  0{index + 1}
                </p>

                {/* State indicator */}

                <motion.span
                  className="h-1.5 w-1.5 bg-black/20 group-hover:bg-[#39FF14]"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.8,
                        }
                  }
                />
              </div>

              <p className="font-mono text-xs uppercase tracking-[0.15em] text-black/40">
                {card.label}
              </p>

              <p className="mt-4 text-lg font-medium">
                {card.title}
              </p>

              <p className="mt-2 max-w-xs text-sm leading-6 text-black/50">
                {card.description}
              </p>

              {/* Bottom progress line */}

              <motion.div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-px bg-[#39FF14]"
                initial={{
                  width: 0,
                }}
                whileInView={{
                  width: "100%",
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.65,
                  delay: shouldReduceMotion
                    ? 0
                    : 0.45 + index * 0.14,
                  ease: "easeOut",
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* =======================================================
            FLOW INDICATOR
        ======================================================== */}

        <motion.div
          className="mt-8 hidden items-center justify-center gap-3 sm:flex"
          initial={
            shouldReduceMotion
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                }
          }
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
            delay: shouldReduceMotion ? 0 : 0.8,
          }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/25">
            action
          </span>

          <motion.span
            className="h-px w-12 bg-black/15"
            initial={{
              scaleX: 0,
            }}
            whileInView={{
              scaleX: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
              delay: shouldReduceMotion ? 0 : 0.9,
            }}
          />

          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/25">
            state
          </span>

          <motion.span
            className="h-px w-12 bg-black/15"
            initial={{
              scaleX: 0,
            }}
            whileInView={{
              scaleX: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
              delay: shouldReduceMotion ? 0 : 1,
            }}
          />

          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#39FF14]">
            recovery
          </span>
        </motion.div>
      </div>
    </section>
  );
}