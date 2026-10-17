"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center">
      <h1 className="text-2xl font-bold text-[#0f2c52]">This page is unavailable</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Something went wrong while loading the portal. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button className="bg-[#0f2c52] text-white hover:bg-[#183d6b]" onClick={reset}>
          Try again
        </Button>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline">
          Return home
        </Button>
      </div>
    </main>
  );
}