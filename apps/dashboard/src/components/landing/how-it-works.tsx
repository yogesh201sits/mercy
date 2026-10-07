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

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-black/10"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        {/* Header + Demo */}
        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/40">
              How it works
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              A recovery path built into the action lifecycle.
            </h2>

            <p className="mt-6 text-lg leading-8 text-black/60">
              Mercy sits between the agent and the systems it changes,
              giving each supported action a defined snapshot, execution,
              verification, and undo path.
            </p>
          </div>

          {/* Animated demo */}
          <div className="flex justify-start lg:justify-end">
            <UndoDemo />
          </div>
        </div>

        {/* Steps */}
        <div className="mt-20 grid border-t border-black/10 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border-b border-black/10 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-black/40">
                  {step.number}
                </span>

                <span className="h-2 w-2 bg-[#39FF14]" />
              </div>

              <h3 className="mt-8 text-2xl font-semibold tracking-tight">
                {step.title}
              </h3>

              <p className="mt-4 text-sm leading-6 text-black/55">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}