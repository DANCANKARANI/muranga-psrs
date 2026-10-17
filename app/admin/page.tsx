import { Suspense } from "react";
import { CheckCircle2, ClipboardList, Gauge, Layers3 } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminStatusFilter } from "@/components/shared/AdminStatusFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestTable } from "@/components/shared/RequestTable";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
] as const;

interface AdminPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = statuses.includes(requestedStatus as (typeof statuses)[number])
    ? (requestedStatus as (typeof statuses)[number])
    : undefined;

  const [requests, counts] = await Promise.all([
    prisma.request.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        updates: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.request.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countFor = (wanted: string) =>
    counts.find((item) => item.status === wanted)?._count._all ?? 0;
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);
  const openCases = countFor("PENDING") + countFor("IN_PROGRESS");
  const resolvedCases = countFor("RESOLVED");
  const resolutionRate = total === 0 ? 0 : Math.round((resolvedCases / total) * 100);
  const barTotal = total || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">Administration</h1>
        <p className="mt-2 text-sm text-slate-600">Review municipal service reports and manage their resolution.</p>
      </div>

      <section aria-label="Service request analytics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total requests" value={total} icon={ClipboardList} />
        <StatCard label="Open cases" value={openCases} icon={Layers3} tone="amber" />
        <StatCard label="Resolved cases" value={resolvedCases} icon={CheckCircle2} tone="green" />
        <div className="rounded-xl border border-[#0f2c52] bg-[#0f2c52] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-100">Resolution rate</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{resolutionRate}%</p>
            </div>
            <Gauge aria-hidden="true" className="size-6 text-blue-100" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Resolution rate" aria-valuemin={0} aria-valuemax={100} aria-valuenow={resolutionRate}>
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>
      </section>

      <section aria-label="Case status proportions" className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Case status distribution</h2>
          <p className="text-xs text-slate-500">Pending {countFor("PENDING")} · In progress {countFor("IN_PROGRESS")} · Resolved {resolvedCases}</p>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <span className="bg-slate-400" style={{ width: `${(countFor("PENDING") / barTotal) * 100}%` }} />
          <span className="bg-amber-500" style={{ width: `${(countFor("IN_PROGRESS") / barTotal) * 100}%` }} />
          <span className="bg-green-600" style={{ width: `${(resolvedCases / barTotal) * 100}%` }} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Service requests</h2>
            <p className="mt-1 text-sm text-slate-600">Select a report to review its location, details, and timeline.</p>
          </div>
          <Suspense fallback={<Skeleton className="h-10 w-full sm:w-52" />}>
            <AdminStatusFilter />
          </Suspense>
        </div>
        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests found"
            description={status ? "There are no reports with this status." : "Municipal service reports will appear here."}
          />
        ) : (
          <RequestTable
            requests={requests.map((request) => ({
              id: request.id,
              trackingId: request.trackingId,
              category: request.category,
              location: request.location,
              status: request.status,
              createdAt: request.createdAt,
              citizenName: request.citizen.name,
            }))}
            detailBasePath="/admin/requests"
            actionLabel="Manage"
            showCitizen
          />
        )}
      </section>
    </div>
  );
}