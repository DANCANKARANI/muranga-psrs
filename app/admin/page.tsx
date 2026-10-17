import { Suspense } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, ClipboardList, Download, Gauge, Layers3 } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminStatusFilter } from "@/components/shared/AdminStatusFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestTable } from "@/components/shared/RequestTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/utils";

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

  // DATABASE_URL uses a single-connection Supabase transaction pooler.
  // Queue queries instead of opening several concurrent Prisma transactions.
  const requests = await prisma.request.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      citizen: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const counts = await prisma.request.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const recentRequests = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      trackingId: true,
      category: true,
      location: true,
      status: true,
      createdAt: true,
    },
  });
  const categoryCounts = await prisma.request.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const countFor = (wanted: string) =>
    counts.find((item) => item.status === wanted)?._count._all ?? 0;
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);
  const openCases = countFor("PENDING") + countFor("IN_PROGRESS");
  const resolvedCases = countFor("RESOLVED");
  const resolutionRate = total === 0 ? 0 : Math.round((resolvedCases / total) * 100);
  const barTotal = total || 1;
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((item) => item._count._all));
  const categories = ["Streetlight", "Water", "Garbage Collection", "Roads", "Drainage", "Other"];
  const categoryCount = (category: string) =>
    categoryCounts.find((item) => item.category === category)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">Administration</h1>
          <p className="mt-2 text-sm text-slate-600">Review municipal service reports and manage their resolution.</p>
        </div>
        <Button
          className="bg-[#0f2c52] text-white hover:bg-[#183d6b]"
          nativeButton={false}
          render={<a download href="/api/admin/reports" />}
        >
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <section aria-label="Service request analytics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={total} icon={ClipboardList} />
        <StatCard label="Open Cases" value={openCases} icon={Layers3} tone="amber" />
        <StatCard label="Resolved Cases" value={resolvedCases} icon={CheckCircle2} tone="green" />
        <div className="rounded-xl border border-[#0f2c52] bg-[#0f2c52] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-100">Resolution rate</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{resolutionRate}%</p>
            </div>
            <Gauge aria-hidden="true" className="size-6 text-blue-100" />
          </div>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded bg-slate-200"
            role="progressbar"
            aria-label="Resolution rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={resolutionRate}
          >
            <div
              className="h-full rounded bg-green-500 transition-all"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </section>

      <section aria-label="Reports overview" className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Request analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-800">Status distribution</h2>
                <p className="text-xs text-slate-500">Pending {countFor("PENDING")} · In progress {countFor("IN_PROGRESS")} · Resolved {resolvedCases}</p>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label="Stacked request status distribution">
                <span className="bg-slate-400" title={`Pending: ${countFor("PENDING")}`} style={{ width: `${(countFor("PENDING") / barTotal) * 100}%` }} />
                <span className="bg-amber-500" title={`In progress: ${countFor("IN_PROGRESS")}`} style={{ width: `${(countFor("IN_PROGRESS") / barTotal) * 100}%` }} />
                <span className="bg-green-600" title={`Resolved: ${resolvedCases}`} style={{ width: `${(resolvedCases / barTotal) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                <span><i className="mr-1.5 inline-block size-2 rounded-full bg-slate-400" />Pending</span>
                <span><i className="mr-1.5 inline-block size-2 rounded-full bg-amber-500" />In progress</span>
                <span><i className="mr-1.5 inline-block size-2 rounded-full bg-green-600" />Resolved</span>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-medium text-slate-800">Reports by category</h2>
              <div className="space-y-3">
                {categories.map((category) => {
                  const value = categoryCount(category);
                  return (
                    <div className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3" key={category}>
                      <span className="truncate text-xs text-slate-600">{category}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#0f2c52]" style={{ width: `${(value / maxCategoryCount) * 100}%` }} />
                      </div>
                      <span className="text-right text-xs font-medium tabular-nums text-slate-700">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity aria-hidden="true" className="size-4 text-[#0f2c52]" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No recent requests.</p>
            ) : (
              <ul className="space-y-4">
                {recentRequests.map((item) => (
                  <li className="min-w-0 border-b border-slate-100 pb-3 last:border-0 last:pb-0" key={item.id}>
                    <Link className="block rounded-sm hover:text-[#0f2c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]" href={`/admin/requests/${item.id}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">{item.category} report</span>
                        <span className="shrink-0 text-xs text-slate-500">{formatTimeAgo(item.createdAt)}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-600">{item.trackingId} · {item.location}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
            quickActions
          />
        )}
      </section>
    </div>
  );
}