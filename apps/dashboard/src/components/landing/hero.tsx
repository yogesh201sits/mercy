"use client";

import { motion, type Variants } from "framer-motion";

const actions = [
    {
        type: "update",
        target: "users/182",
        status: "COMPLETED",
    },
    {
        type: "delete",
        target: "invoices/91",
        status: "UNDONE",
    },
    {
        type: "custom",
        target: "payment-service",
        status: "COMPLETED",
    },
];

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
};

const itemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 18,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

const actionVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -12,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

export function Hero() {
    return (
        <section className="relative overflow-hidden border-b border-black/10">
            {/* Technical grid */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.04 }}
                transition={{ duration: 1.2 }}
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #000 1px, transparent 1px),
                        linear-gradient(to bottom, #000 1px, transparent 1px)
                    `,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Runtime marker — top right */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute right-[8%] top-24 hidden h-20 w-20 border border-black/10 lg:block"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.8,
                    delay: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <motion.span
                    className="absolute -left-1 -top-1 h-2 w-2 bg-[#39FF14]"
                    animate={{
                        opacity: [1, 0.35, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-black" />
            </motion.div>

            {/* Runtime marker — left */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-[6%] top-[42%] hidden w-32 border-t border-black/10 lg:block"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{
                    duration: 0.7,
                    delay: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: "left" }}
            >
                <motion.span
                    className="absolute -top-[3px] left-0 h-1.5 w-1.5 bg-[#39FF14]"
                    animate={{
                        opacity: [1, 0.3, 1],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>

            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
                {/* Left */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div
                        variants={itemVariants}
                        className="mb-8 inline-flex items-center gap-2 border border-black/15 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em]"
                    >
                        <motion.span
                            className="h-1.5 w-1.5 bg-[#39FF14]"
                            animate={{
                                opacity: [1, 0.4, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        Reversible infrastructure for AI agents
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        variants={itemVariants}
                        className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-8xl"
                    >
                        Make AI agent
                        <br />
                        actions{" "}
                        <motion.span
                            className="inline-block bg-[#39FF14] px-2"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            transition={{
                                duration: 0.7,
                                delay: 0.65,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            reversible.
                        </motion.span>
                    </motion.h1>

                    {/* Description */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-8 max-w-xl"
                    >
                        <p className="text-xl font-semibold leading-7 tracking-[-0.02em] text-black sm:text-2xl">
                            <span className="border-l-4 border-[#39FF14] pl-4">
                                Because “my bad” isn’t a rollback strategy.
                            </span>
                        </p>

                        <p className="mt-4 text-lg leading-8 text-black/60">
                            Mercy captures state before supported actions,
                            so agents can safely undo what they changed.
                        </p>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-10 flex flex-wrap gap-3"
                    >
                        <motion.a
                            href="/dashboard"
                            whileHover={{
                                y: -2,
                            }}
                            whileTap={{
                                y: 0,
                            }}
                            transition={{
                                duration: 0.15,
                            }}
                            className="border border-black bg-black px-6 py-3 text-sm font-medium text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
                        >
                            Get started
                        </motion.a>

                        <motion.a
                            href="#developers"
                            whileHover={{
                                y: -2,
                            }}
                            whileTap={{
                                y: 0,
                            }}
                            transition={{
                                duration: 0.15,
                            }}
                            className="border border-black/20 px-6 py-3 text-sm font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
                        >
                            View documentation
                        </motion.a>
                    </motion.div>

                    {/* SDK */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-12 flex items-center gap-3 text-xs text-black/40"
                    >
                        <span className="font-mono">
                            npm install @mercy/sdk
                        </span>

                        <span className="h-1 w-1 bg-[#39FF14]" />

                        <span>TypeScript SDK</span>
                    </motion.div>
                </motion.div>

                {/* Right */}
                <motion.div
                    className="relative"
                    initial={{
                        opacity: 0,
                        y: 28,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.8,
                        delay: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    {/* Technical offset frame */}
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 translate-x-3 translate-y-3 border border-[#39FF14]/20"
                        initial={{
                            opacity: 0,
                            x: 0,
                            y: 0,
                        }}
                        animate={{
                            opacity: 1,
                            x: 12,
                            y: 12,
                        }}
                        transition={{
                            duration: 0.8,
                            delay: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    />

                    <div className="relative border border-black bg-black p-1">
                        <div className="border border-white/10 bg-[#080808]">
                            {/* Header */}
                            <motion.div
                                className="flex h-12 items-center justify-between border-b border-white/10 px-5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.65,
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <motion.span
                                        className="h-2 w-2 bg-[#39FF14]"
                                        animate={{
                                            opacity: [1, 0.4, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />

                                    <span className="text-sm font-medium text-white">
                                        mercy
                                    </span>
                                </div>

                                <span className="font-mono text-xs text-white/40">
                                    production
                                </span>
                            </motion.div>

                            <div className="p-5">
                                {/* Recent action */}
                                <motion.div
                                    className="mb-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.75,
                                    }}
                                >
                                    <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                                        Recent action
                                    </p>

                                    <motion.div
                                        className="mt-3 border border-white/10"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.85,
                                        }}
                                    >
                                        <div className="grid grid-cols-[100px_1fr] border-b border-white/10 px-4 py-4">
                                            <span className="font-mono text-xs text-white/40">
                                                TYPE
                                            </span>

                                            <span className="font-mono text-sm text-white">
                                                update
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-[100px_1fr] border-b border-white/10 px-4 py-4">
                                            <span className="font-mono text-xs text-white/40">
                                                TARGET
                                            </span>

                                            <span className="font-mono text-sm text-white">
                                                users/182
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between px-4 py-4">
                                            <motion.span
                                                className="flex items-center gap-2 font-mono text-xs text-[#39FF14]"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: 1,
                                                }}
                                            >
                                                <motion.span
                                                    className="h-1.5 w-1.5 bg-[#39FF14]"
                                                    animate={{
                                                        opacity: [1, 0.3, 1],
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                />

                                                COMPLETED
                                            </motion.span>

                                            <motion.button
                                                type="button"
                                                whileHover={{
                                                    backgroundColor: "#39FF14",
                                                    color: "#000000",
                                                }}
                                                whileTap={{
                                                    scale: 0.97,
                                                }}
                                                transition={{
                                                    duration: 0.15,
                                                }}
                                                className="border border-[#39FF14] px-4 py-2 text-xs font-medium text-[#39FF14]"
                                            >
                                                UNDO ACTION
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Stats */}
                                <motion.div
                                    className="grid grid-cols-3 border-t border-white/10 pt-5"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.div variants={itemVariants}>
                                        <p className="font-mono text-xs text-white/40">
                                            ACTIONS
                                        </p>

                                        <p className="mt-2 text-2xl font-semibold text-white">
                                            128
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <p className="font-mono text-xs text-white/40">
                                            UNDOABLE
                                        </p>

                                        <p className="mt-2 text-2xl font-semibold text-[#39FF14]">
                                            91
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <p className="font-mono text-xs text-white/40">
                                            CONFLICTS
                                        </p>

                                        <p className="mt-2 text-2xl font-semibold text-white">
                                            3
                                        </p>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Action log */}
                    <motion.div
                        className="absolute -bottom-8 -left-8 hidden w-64 border border-black bg-white p-4 shadow-[8px_8px_0_#39FF14] sm:block"
                        initial={{
                            opacity: 0,
                            x: -20,
                            y: 15,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.7,
                            delay: 0.8,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Action log
                            </span>

                            <motion.span
                                className="font-mono text-[10px] text-black/40"
                                animate={{
                                    opacity: [1, 0.4, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                LIVE
                            </motion.span>
                        </div>

                        <motion.div
                            className="space-y-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {actions.map((action) => (
                                <motion.div
                                    key={`${action.type}-${action.target}`}
                                    variants={actionVariants}
                                    className="flex items-center justify-between gap-3 text-xs"
                                >
                                    <div className="min-w-0">
                                        <p className="font-mono font-medium">
                                            {action.type}
                                        </p>

                                        <p className="truncate font-mono text-black/40">
                                            {action.target}
                                        </p>
                                    </div>

                                    <span className="shrink-0 text-[10px] font-medium text-green-600">
                                        {action.status}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom technical labels */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-5 left-8 hidden items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-black/20 lg:flex"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: 1.1,
                }}
            >
                <span>runtime</span>
                <span className="h-px w-8 bg-black/10" />
                <span>state capture</span>
                <span className="h-px w-8 bg-black/10" />
                <span>undo</span>
            </motion.div>

            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-5 right-8 hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-black/20 lg:flex"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: 1.2,
                }}
            >
                <motion.span
                    className="h-1.5 w-1.5 bg-[#39FF14]"
                    animate={{
                        opacity: [1, 0.3, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                <span>reversible runtime</span>
            </motion.div>
        </section>
    );
}