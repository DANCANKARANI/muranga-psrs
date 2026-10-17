"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard rendering failed", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-[#0f2c52]">Dashboard unavailable</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        We could not load this page. Please try again.
      </p>
      <Button className="mt-5 bg-[#0f2c52] text-white hover:bg-[#183d6b]" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}