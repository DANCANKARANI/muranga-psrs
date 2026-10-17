import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center">
      <p className="font-mono text-sm font-semibold text-slate-500">403</p>
      <h1 className="mt-2 text-2xl font-bold text-[#0f2c52]">Access denied</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        You do not have permission to view this request.
      </p>
      <Button className="mt-6 bg-[#0f2c52] text-white hover:bg-[#183d6b]" nativeButton={false} render={<Link href="/dashboard" />}>
        Return to dashboard
      </Button>
    </main>
  );
}