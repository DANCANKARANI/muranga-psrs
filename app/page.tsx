import Image from "next/image";
import countyCrest from "@/public/logo.png";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FilePlus2, Gauge } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const instant = false;

const features = [
  {
    icon: FilePlus2,
    title: "Report an Issue",
    description: "Report broken streetlights, water interruptions, garbage collection issues, and more.",
  },
  {
    icon: ClipboardCheck,
    title: "Track Progress",
    description: "Use your tracking number to follow updates from submission through resolution.",
  },
  {
    icon: Gauge,
    title: "Get Resolved",
    description: "County teams review reports and record progress toward resolving each issue.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              alt="Murang’a County Government crest"
              className="size-12 object-contain"
              height={48}
              priority
              src={countyCrest}
              width={48}
            />
            <div>
              <p className="text-sm font-bold text-[#0f2c52]">Murang&apos;a County</p>
              <p className="text-xs text-slate-600">Public Service Portal</p>
            </div>
          </div>
          <Link className="text-sm font-semibold text-[#0f2c52] hover:underline" href="/login?role=CITIZEN">
            Citizen sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f2c52]">
                Murang&apos;a County
              </h1>
              <p className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-[#0f2c52] sm:text-5xl">
                Public Service Portal
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Report municipal issues — broken streetlights, water interruptions, garbage collection — and track their resolution.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  className="rounded-lg border border-[#0f2c52] bg-[#0f2c52] p-4 text-white transition hover:bg-[#183d6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52] focus-visible:ring-offset-2"
                  href="/login?role=CITIZEN"
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    Citizen sign in <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                  <span className="mt-1 block text-xs text-blue-100">Submit and track municipal reports</span>
                </Link>
                <Link
                  className="rounded-lg border border-slate-300 bg-white p-4 text-[#0f2c52] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52] focus-visible:ring-offset-2"
                  href="/login?role=ADMIN"
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    Public servant / admin <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">Staff access to request administration</span>
                </Link>
              </div>
              <Link className="mt-4 inline-block text-sm font-medium text-[#0f2c52] underline-offset-4 hover:underline" href="/track">
                Track a request without signing in
              </Link>
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="flex size-64 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                <Image
                  alt="Murang’a County Government crest"
                  className="size-48 object-contain"
                  height={192}
                  src={countyCrest}
                  width={192}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
              County services, made accessible
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A straightforward way to submit a request and stay informed.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="rounded-xl border border-slate-200 bg-white p-6" key={title}>
                <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#0f2c52]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-slate-500">
            © 2026 Murang&apos;a County Government <span aria-hidden="true">·</span>{" "}
            <Link className="font-medium text-[#0f2c52] hover:underline" href="/track">
              Track a request
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
