import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-48" />
        </div>

        <div className="grid gap-px border border-black/10 bg-black/10 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-6"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="mt-8 border border-black/10 bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
            <Skeleton className="h-4 w-32" />

            <Spinner className="size-4" />
          </div>

          <div className="divide-y divide-black/10">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-6 py-5"
              >
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>

                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}