const stats = [
  {
    label: "Total actions",
    value: "128",
    detail: "All recorded actions",
  },
  {
    label: "Completed",
    value: "121",
    detail: "Successful executions",
  },
  {
    label: "Undone",
    value: "7",
    detail: "Successfully reversed",
  },
  {
    label: "Failed",
    value: "0",
    detail: "Execution failures",
  },
];

const recentActions = [
  {
    action: "update",
    target: "users/182",
    status: "completed",
    time: "2 min ago",
  },
  {
    action: "delete",
    target: "invoices/91",
    status: "undone",
    time: "8 min ago",
  },
  {
    action: "custom",
    target: "payment-service",
    status: "completed",
    time: "14 min ago",
  },
  {
    action: "update",
    target: "users/164",
    status: "completed",
    time: "21 min ago",
  },
  {
    action: "delete",
    target: "orders/731",
    status: "undone",
    time: "34 min ago",
  },
];

function Status({ status }: { status: string }) {
  const isPositive =
    status === "completed" || status === "undone";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 ${
          isPositive ? "bg-[#39FF14]" : "bg-black/20"
        }`}
      />

      <span
        className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
          isPositive ? "text-black/70" : "text-black/40"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="border-b border-black/10 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
          Workspace
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              Overview
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
              Monitor reversible actions, execution state, and
              recovery activity across your Mercy runtime.
            </p>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">
            project / default
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="mt-8">
        <div className="grid border-y border-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-5 py-6 ${
                index < stats.length - 1
                  ? "border-b border-black/10 sm:border-r lg:border-b-0"
                  : ""
              } ${
                index === 1
                  ? "sm:border-r-0 lg:border-r"
                  : ""
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                {stat.value}
              </p>

              <p className="mt-2 text-xs text-black/40">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent actions */}
      <section className="mt-12">
        <div className="flex items-end justify-between border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35">
              Activity
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Recent actions
            </h2>
          </div>

          <a
            href="/dashboard/actions"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/45 transition-colors hover:text-black"
          >
            View all →
          </a>
        </div>

        <div className="border-b border-black/10">
          {recentActions.map((item) => (
            <div
              key={`${item.action}-${item.target}-${item.time}`}
              className="grid gap-4 border-b border-black/10 px-2 py-5 last:border-b-0 sm:grid-cols-[1fr_1.5fr_140px_100px] sm:items-center"
            >
              <div>
                <p className="font-mono text-xs text-black/40">
                  {item.action}
                </p>
              </div>

              <div>
                <p className="font-mono text-sm font-medium">
                  {item.target}
                </p>
              </div>

              <Status status={item.status} />

              <p className="font-mono text-[10px] text-black/35 sm:text-right">
                {item.time}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Runtime status */}
      <section className="mt-12 grid gap-px border border-black/10 bg-black/10 md:grid-cols-3">
        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            Runtime
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 bg-[#39FF14]" />

            <span className="text-sm font-medium">
              Operational
            </span>
          </div>
        </div>

        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            Adapters
          </p>

          <p className="mt-3 text-sm font-medium">
            3 connected
          </p>
        </div>

        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/35">
            Recovery
          </p>

          <p className="mt-3 text-sm font-medium">
            Available
          </p>
        </div>
      </section>
    </div>
  );
}