import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import countyCrest from "@/public/logo.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900"
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-5 sm:px-8">
          <Image
            alt="Murang’a County Government crest"
            className="size-12 shrink-0 object-contain"
            height={48}
            priority
            src={countyCrest}
            width={48}
          />
          <div>
            <p className="text-sm font-bold leading-5 text-[#0f2c52]">
              Murang&apos;a County
            </p>
            <p className="text-xs leading-5 text-slate-600">
              Public Service Portal
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </section>
      </main>

      <footer className="px-5 py-5 text-center text-xs text-slate-500">
        <p>© 2026 Murang&apos;a County Government. All rights reserved.</p>
        <Link
          className="mt-2 inline-block font-medium text-[#0f2c52] underline-offset-4 hover:underline"
          href="/track"
        >
          Track a request without signing in
        </Link>
      </footer>
    </div>
  );
}
