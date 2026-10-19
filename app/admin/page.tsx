import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardList, Layers3, Percent } from "lucide-react";
import { RequestTable, type RequestTableItem } from "@/components/shared/RequestTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatTimeAgo } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const now = new Date();
  const counts = await prisma.request.groupBy({ by: ["status"], _count: { _all: true } });
  const overdueCount = await prisma.request.count({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] }, slaDeadline: { lt: now } },
  });
  const overdue = await prisma.request.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] }, slaDeadline: { lt: now } },
    orderBy: { slaDeadline: "asc" },
    take: 6,
    select: { id: true, trackingId: true, category: true, location: true, slaDeadline: true },
  });
  const recent = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      trackingId: true,
      category: true,
      location: true,
      status: true,
      priority: true,
      upvotes: true,
      slaDeadline: true,
      createdAt: true,
      citizen: { select: { name: true } },
    },
  });

  const countFor = (status: string) => counts.find((item) => item.status === status)?._count._all ?? 0;
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);
  const open = countFor("PENDING") + countFor("IN_PROGRESS");
  const resolved = countFor("RESOLVED");
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  const priorities = ["CRITICAL", "HIGH", "NORMAL", "LOW"] as const;
  const tableRequests: RequestTableItem[] = recent.map((request) => ({
    ...request,
    priority: priorities.includes(request.priority as (typeof priorities)[number])
      ? request.priority as RequestTableItem["priority"]
      : "NORMAL",
    overdue: request.status !== "RESOLVED" && request.slaDeadline.getTime() < now.getTime(),
    citizenName: request.citizen.name,
  }));

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#0b2342] via-[#0f2c52] to-[#1b4c78] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Municipal operations · Triage</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Good day, {session.name || "Admin"}</h1>
          <p className="mt-1.5 text-sm text-blue-100">Review overdue cases and the latest reports needing attention.</p>
        </div>
        <Button className="self-start bg-white text-[#0f2c52] hover:bg-blue-50 sm:self-auto" variant="outline" nativeButton={false} render={<Link href="/admin/reports" />}>Open Reports Dashboard</Button>
      </header>

      <section aria-label="Request summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={total} icon={ClipboardList} />
        <StatCard label="Open Requests" value={open} icon={Layers3} tone="amber" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="green" />
        <StatCard label="Resolution Rate" value={`${resolutionRate}%`} icon={Percent} tone="navy" />
      </section>

      <Card className="overflow-hidden border-amber-200/80 shadow-sm">
        <CardHeader className="border-b border-amber-100 bg-amber-50/70 pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle aria-hidden="true" className="size-4 text-amber-700" />Needs Attention · Overdue<span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{overdueCount}</span></CardTitle>
          <p className="text-xs text-slate-600">Open requests that have passed their SLA deadline</p>
        </CardHeader>
        <CardContent className="p-0">
          {overdue.length ? <ul className="divide-y divide-slate-100">{overdue.map((request) => (
            <li className="flex items-center justify-between gap-3 p-3 sm:px-4" key={request.id}>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{request.category} · {request.location}</p><p className="mt-0.5 truncate text-xs text-slate-500">{request.trackingId} · SLA passed {formatTimeAgo(request.slaDeadline, now)}</p></div>
              <Link className="shrink-0 rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50" href={`/admin/requests/${request.id}`}>Manage</Link>
            </li>
          ))}</ul> : <div className="m-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">No overdue open requests.</div>}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-900">Recent Requests</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{Math.min(total, recent.length)} of {total}</span></div><p className="mt-1 text-sm text-slate-500">Latest submissions across the county.</p></div>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/requests" />}>All Requests</Button>
        </div>
        {tableRequests.length ? <RequestTable requests={tableRequests} detailBasePath="/admin/requests" actionLabel="Open" showCitizen showPriority showUpvotes showOverdue quickActions /> : <Card><CardContent className="py-12 text-center text-sm text-slate-500">No service requests have been submitted yet.</CardContent></Card>}
      </section>
    </div>
  );
}
