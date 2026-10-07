"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    label: "ACTION",
    value: "users/182",
    detail: "UPDATE",
  },
  {
    label: "SNAPSHOT",
    value: "state captured",
    detail: "READY",
  },
  {
    label: "EXECUTE",
    value: "users/182",
    detail: "CHANGED",
  },
  {
    label: "UNDO",
    value: "restoring state",
    detail: "RUNNING",
  },
  {
    label: "RESTORED",
    value: "users/182",
    detail: "SAFE",
  },
];

export function UndoDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const current = steps[step];

  return (
    <div className="w-full max-w-md border border-black/15 bg-white text-black shadow-[6px_6px_0_#39FF14]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#39FF14]" />

          <span className="font-mono text-[10px] text-black/50">
            mercy / runtime
          </span>
        </div>

        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/30">
          live
        </span>
      </div>

      {/* Current state */}
      <div className="border-b border-black/10 px-4 py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/35">
          Current operation
        </p>

        <div
          key={step}
          className="mt-2 animate-[mercy-step_350ms_ease-out]"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-medium text-[#16c900]">
              {current.label}
            </p>

            <span className="font-mono text-[9px] text-black/30">
              {current.detail}
            </span>
          </div>

          <p className="mt-1 text-lg font-semibold tracking-tight">
            {current.value}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-3">
        {steps.map((item, index) => {
          const active = index === step;
          const completed = index < step;

          return (
            <div
              key={item.label}
              className={`flex items-center justify-between px-3 py-2 transition-all duration-500 ${
                active
                  ? "border border-[#39FF14]/50 bg-[#39FF14]/8"
                  : "border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 ${
                    active || completed
                      ? "bg-[#39FF14]"
                      : "bg-black/15"
                  }`}
                />

                <span
                  className={`font-mono text-[9px] ${
                    active
                      ? "text-black"
                      : "text-black/40"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              <span
                className={`font-mono text-[9px] ${
                  active
                    ? "text-black/60"
                    : completed
                      ? "text-[#16c900]"
                      : "text-black/20"
                }`}
              >
                {completed
                  ? "DONE"
                  : active
                    ? "RUNNING"
                    : "WAITING"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}