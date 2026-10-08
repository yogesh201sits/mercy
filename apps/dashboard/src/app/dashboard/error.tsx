"use client";

import { DashboardError } from "@/components/dashboard/dashboard-error";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function Error({
  error,
  reset,
}: ErrorProps) {
  return (
    <DashboardError
      error={error}
      reset={reset}
    />
  );
}