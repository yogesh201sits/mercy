"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

const systems = [
{
index: "01",
name: "Filesystem",
target: "files",
description:
"Capture and restore files and directories with path validation and state verification.",
examples: ["create", "update", "delete", "rename", "move"],
},
{
index: "02",
name: "PostgreSQL",
target: "postgres",
description:
"Protect database changes with snapshots, deterministic state checks, and reversible operations.",
examples: ["delete_rows", "update_rows"],
},
{
index: "03",
name: "Custom",
target: "your-system",
description:
"Wrap your own tools and external systems with Mercy's universal adapter contract.",
examples: ["API", "tool", "service", "workflow"],
},
];

export function Systems() {
const reducedMotion = useReducedMotion();

const containerVariants: Variants = {
hidden: {},
visible: {
transition: {
staggerChildren: 0.18,
delayChildren: 0.2,
},
},
};

const cardVariants: Variants = {
hidden: {
opacity: 0,
y: 35,
},
visible: {
opacity: 1,
y: 0,
transition: {
duration: 0.65,
ease: [0.22, 1, 0.36, 1],
},
},
};

const chipVariants: Variants = {
hidden: {
opacity: 0,
y: 6,
},
visible: {
opacity: 1,
y: 0,
transition: {
duration: 0.3,
},
},
};

return ( <section className="relative overflow-hidden border-b border-black/10">
{/* Technical background */}

  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 opacity-[0.025]"
    style={{
      backgroundImage:
        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
      backgroundSize: "64px 64px",
    }}
  />

  <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
    {/* Header */}

    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 25 }}
        {...(reducedMotion
          ? {}
          : {
              whileInView: {
                opacity: 1,
                y: 0,
              },
            })}
        viewport={{
          once: true,
          amount: 0.3,
        }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="max-w-2xl"
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="h-2 w-2 bg-[#39FF14]"
            {...(reducedMotion
              ? {}
              : {
                  animate: {
                    opacity: [1, 0.35, 1],
                  },
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                })}
          />

          <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
            Supported systems
          </p>
        </div>

        <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
          One runtime.
          <br />
          Different systems.
        </h2>
      </motion.div>

      <motion.p
        initial={reducedMotion ? false : { opacity: 0, x: 25 }}
        {...(reducedMotion
          ? {}
          : {
              whileInView: {
                opacity: 1,
                x: 0,
              },
            })}
        viewport={{
          once: true,
          amount: 0.3,
        }}
        transition={{
          duration: 0.7,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="max-w-md text-lg leading-8 text-black/60"
      >
        Mercy uses adapters to define how state is captured, changed,
        verified, and restored for each system.
      </motion.p>
    </div>

    {/* Adapter cards */}

    <motion.div
      variants={containerVariants}
      initial={reducedMotion ? false : "hidden"}
      {...(reducedMotion
        ? {}
        : {
            whileInView: "visible",
          })}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      className="mt-20 grid border-t border-black/10 lg:grid-cols-3"
    >
      {systems.map((system, index) => (
        <motion.article
          key={system.name}
          variants={cardVariants}
          className="group relative border-b border-black/10 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
        >
          {/* Adapter online line */}

          <motion.div
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-px origin-left bg-[#39FF14]"
            initial={{
              scaleX: 0,
            }}
            {...(reducedMotion
              ? {
                  animate: {
                    scaleX: 1,
                  },
                }
              : {
                  whileInView: {
                    scaleX: 1,
                  },
                })}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            transition={{
              duration: 0.7,
              delay: 0.35 + index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Header */}

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-black/40">
              {system.index}
            </span>

            <div className="flex items-center gap-2">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-black/20"
                initial={{
                  opacity: 0.4,
                }}
                {...(reducedMotion
                  ? {
                      animate: {
                        backgroundColor: "#39FF14",
                        opacity: 1,
                      },
                    }
                  : {
                      whileInView: {
                        backgroundColor: "#39FF14",
                        opacity: [0.3, 1, 1],
                        boxShadow: [
                          "0 0 0px rgba(57,255,20,0)",
                          "0 0 10px rgba(57,255,20,0.8)",
                          "0 0 4px rgba(57,255,20,0.4)",
                        ],
                      },
                    })}
                viewport={{
                  once: true,
                  amount: 0.5,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.65 + index * 0.12,
                }}
              />

              <span className="font-mono text-xs text-black/40">
                adapter
              </span>
            </div>
          </div>

          {/* System */}

          <div className="mt-12">
            <div className="flex items-center gap-3">
              <motion.span
                className="relative h-2.5 w-2.5 bg-[#39FF14]"
                initial={{
                  scale: 0.6,
                  opacity: reducedMotion ? 1 : 0,
                }}
                {...(reducedMotion
                  ? {}
                  : {
                      whileInView: {
                        scale: [0.6, 1.15, 1],
                        opacity: [0, 1, 1],
                      },
                    })}
                viewport={{
                  once: true,
                  amount: 0.5,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.55 + index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />

              <motion.h3
                className="text-2xl font-semibold tracking-tight"
                initial={
                  reducedMotion
                    ? false
                    : {
                        opacity: 0,
                        x: -10,
                      }
                }
                {...(reducedMotion
                  ? {}
                  : {
                      whileInView: {
                        opacity: 1,
                        x: 0,
                      },
                    })}
                viewport={{
                  once: true,
                  amount: 0.5,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.6 + index * 0.12,
                }}
              >
                {system.name}
              </motion.h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-black/60">
              {system.description}
            </p>
          </div>

          {/* Target */}

          <motion.div
            className="mt-8 border border-black/10 bg-[#F7F7F7] p-4"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 10,
                  }
            }
            {...(reducedMotion
              ? {}
              : {
                  whileInView: {
                    opacity: 1,
                    y: 0,
                  },
                })}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            transition={{
              duration: 0.45,
              delay: 0.75 + index * 0.12,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-black/40">
                Target
              </p>

              <motion.span
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/30"
                initial={{
                  opacity: 0,
                }}
                {...(reducedMotion
                  ? {
                      animate: {
                        opacity: 1,
                        color: "#000",
                      },
                    }
                  : {
                      whileInView: {
                        opacity: [0, 1],
                        color: ["rgba(0,0,0,0.3)", "#000"],
                      },
                    })}
                viewport={{
                  once: true,
                  amount: 0.5,
                }}
                transition={{
                  duration: 0.4,
                  delay: 1 + index * 0.12,
                }}
              >
                connected
              </motion.span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-sm">
                {system.target}
              </p>

              {/* Target status */}

              <div className="relative flex h-3 w-3 items-center justify-center">
                <motion.span
                  className="absolute h-3 w-3 rounded-full border border-[#39FF14]"
                  initial={{
                    scale: reducedMotion ? 1.5 : 0,
                    opacity: reducedMotion ? 0 : 0,
                  }}
                  {...(reducedMotion
                    ? {
                        animate: {
                          opacity: 0,
                        },
                      }
                    : {
                        whileInView: {
                          scale: [0, 1.8, 1.5],
                          opacity: [0, 0.35, 0],
                        },
                      })}
                  viewport={{
                    once: true,
                    amount: 0.5,
                  }}
                  transition={{
                    duration: 1.1,
                    delay: 1 + index * 0.12,
                    ease: "easeOut",
                  }}
                />

                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-black/20"
                  initial={{
                    scale: 0.5,
                  }}
                  {...(reducedMotion
                    ? {
                        animate: {
                          scale: 1,
                          backgroundColor: "#39FF14",
                        },
                      }
                    : {
                        whileInView: {
                          scale: [0.5, 1.2, 1],
                          backgroundColor: [
                            "rgba(0,0,0,0.2)",
                            "#39FF14",
                            "#39FF14",
                          ],
                        },
                      })}
                  viewport={{
                    once: true,
                    amount: 0.5,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 1 + index * 0.12,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Examples */}

          <motion.div
            initial={reducedMotion ? false : "hidden"}
            {...(reducedMotion
              ? {}
              : {
                  whileInView: "visible",
                })}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 1.05 + index * 0.12,
                },
              },
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {system.examples.map((example) => (
              <motion.span
                key={example}
                variants={chipVariants}
                className="border border-black/10 px-2.5 py-1 font-mono text-[10px] text-black/50"
                {...(reducedMotion
                  ? {}
                  : {
                      whileHover: {
                        borderColor: "rgba(57,255,20,0.5)",
                        color: "#000",
                        y: -2,
                      },
                    })}
              >
                {example}
              </motion.span>
            ))}
          </motion.div>

          {/* Online status */}

          <motion.div
            className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-black/30"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                  }
            }
            {...(reducedMotion
              ? {
                  animate: {
                    opacity: 1,
                  },
                }
              : {
                  whileInView: {
                    opacity: 1,
                  },
                })}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            transition={{
              duration: 0.4,
              delay: 1.15 + index * 0.12,
            }}
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#39FF14]"
              {...(reducedMotion
                ? {}
                : {
                    animate: {
                      opacity: [1, 0.35, 1],
                    },
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    },
                  })}
            />

            adapter online
          </motion.div>
        </motion.article>
      ))}
    </motion.div>
  </div>
</section>

);
}
