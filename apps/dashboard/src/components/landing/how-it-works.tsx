"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

import { UndoDemo } from "./undo-demo";

const steps = [
  {
    number: "01",
    title: "Capture",
    description:
      "Mercy captures the state required to reverse a supported action before execution begins.",
  },
  {
    number: "02",
    title: "Execute",
    description:
      "The agent performs the requested action through a Mercy adapter.",
  },
  {
    number: "03",
    title: "Verify",
    description:
      "Mercy records the resulting state and can verify whether the target has changed since execution.",
  },
  {
    number: "04",
    title: "Undo",
    description:
      "When an action needs to be reversed, Mercy restores or compensates using the captured state.",
  },
];

const headerVariants: Variants = {
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

const demoVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 45,
    rotateY: -5,
  },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const stepsContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const stepVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
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

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  const motionHeader: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : headerVariants;

  const motionDemo: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : demoVariants;

  const motionStepsContainer: Variants = shouldReduceMotion
    ? {
        hidden: {},
        visible: {},
      }
    : stepsContainer;

  const motionStep: Variants = shouldReduceMotion
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
    : stepVariants;

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-b border-black/10"
    >
      {/* =========================================================
          BACKGROUND GRID
      ========================================================== */}

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          initial={{
            backgroundPosition: "0px 0px",
          }}
          whileInView={{
            backgroundPosition: "32px 32px",
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 10,
            ease: "linear",
          }}
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        {/* =========================================================
            HEADER + DEMO
        ========================================================== */}

        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          {/* Header */}

          <motion.div
            className="max-w-2xl"
            variants={motionHeader}
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
                  ease: "easeOut",
                }}
              />

              <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
                How it works
              </p>
            </div>

            {/* Heading */}

            <motion.h2
              className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl"
              variants={motionHeader}
            >
              A recovery path built into the action lifecycle.
            </motion.h2>

            {/* Description */}

            <motion.p
              className="mt-6 text-lg leading-8 text-black/60"
              variants={motionHeader}
            >
              Mercy sits between the agent and the systems it changes,
              giving each supported action a defined snapshot, execution,
              verification, and undo path.
            </motion.p>

            {/* Lifecycle signal */}

            <motion.div
              className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-black/30"
              variants={motionHeader}
            >
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

              Action lifecycle protected
            </motion.div>
          </motion.div>

          {/* =======================================================
              UNDO DEMO
          ======================================================== */}

          <motion.div
            className=""
            variants={motionDemo}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.25,
            }}
            style={{
              perspective: 1200,
            }}
          >
            <motion.div
              className="relative"
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
            >
              {/* Ambient glow behind demo */}

              {!shouldReduceMotion && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-5 bg-[#39FF14]/10 blur-3xl"
                  animate={{
                    opacity: [0.12, 0.25, 0.12],
                    scale: [0.98, 1.03, 0.98],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              <div className="relative">
                <UndoDemo />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* =========================================================
            LIFECYCLE STEPS
        ========================================================== */}

        <motion.div
          className="relative mt-20 grid border-t border-black/10 lg:grid-cols-4"
          variants={motionStepsContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.2,
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={motionStep}
              className={[
                "group relative border-b border-black/10 py-8",
                "lg:border-b-0 lg:border-r lg:px-8",
                "lg:first:pl-0",
                "lg:last:border-r-0",
                "lg:last:pr-0",
              ].join(" ")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      backgroundColor: "rgba(0,0,0,0.018)",
                    }
              }
            >
              {/* =================================================
                  STEP HEADER
              ================================================== */}

              <div className="flex items-center justify-between">
                <motion.span
                  className="font-mono text-xs text-black/40"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          color: "#000000",
                        }
                  }
                >
                  {step.number}
                </motion.span>

                <div className="relative flex h-2 w-2 items-center justify-center">
                  {/* Pulse */}

                  {!shouldReduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute h-2 w-2 bg-[#39FF14]"
                      animate={{
                        scale: [1, 2.8, 1],
                        opacity: [0.35, 0, 0.35],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: index * 0.35,
                        ease: "easeOut",
                      }}
                    />
                  )}

                  <span className="relative h-2 w-2 bg-[#39FF14]" />
                </div>
              </div>

              {/* =================================================
                  TITLE
              ================================================== */}

              <motion.h3
                className="mt-8 text-2xl font-semibold tracking-tight"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        x: 4,
                        transition: {
                          duration: 0.2,
                        },
                      }
                }
              >
                {step.title}
              </motion.h3>

              {/* =================================================
                  DESCRIPTION
              ================================================== */}

              <p className="mt-4 text-sm leading-6 text-black/55">
                {step.description}
              </p>

              {/* =================================================
                  PROGRESS LINE
              ================================================== */}

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
                    : 0.35 + index * 0.12,
                  ease: "easeOut",
                }}
              />

              {/* =================================================
                  STEP CONNECTOR
              ================================================== */}

              {index < steps.length - 1 && (
                <motion.div
                  aria-hidden="true"
                  className="absolute right-0 top-[21px] hidden h-px w-8 translate-x-1/2 bg-black/10 lg:block"
                  initial={{
                    scaleX: 0,
                    opacity: 0,
                  }}
                  whileInView={{
                    scaleX: 1,
                    opacity: 1,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion
                      ? 0
                      : 0.55 + index * 0.12,
                    ease: "easeOut",
                  }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* =========================================================
            BOTTOM LIFECYCLE LABEL
        ========================================================== */}

        <motion.div
          className="mt-10 hidden items-center justify-between sm:flex"
          initial={
            shouldReduceMotion
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                  y: 10,
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
            duration: 0.6,
            delay: shouldReduceMotion ? 0 : 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/25">
            Agent action
          </span>

          <div className="mx-6 h-px flex-1 bg-black/10" />

          <motion.span
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/30"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.3, 0.7, 0.3],
                  }
            }
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Mercy recovery boundary
          </motion.span>

          <div className="mx-6 h-px flex-1 bg-black/10" />

          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#39FF14]">
            Reversible state
          </span>
        </motion.div>
      </div>
    </section>
  );
}