import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDot, ClipboardList, Clock3, Download, Layers3, ThumbsUp } from "lucide-react";
import { redirect } from "next/navigation";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { StatusChart } from "@/components/admin/StatusChart";
import { RequestTable, type RequestTableItem } from "@/components/shared/RequestTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTimeAgo } from "@/lib/utils";
const priorityValues = ["CRITICAL", "HIGH", "NORMAL", "LOW"] as const;

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const now = new Date();
  const urgentCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const counts = await prisma.request.groupBy({ by: ["status"], _count: { _all: true } });
  const categories = await prisma.request.groupBy({ by: ["category"], _count: { _all: true } });
  const urgent = await prisma.request.findMany({
    where: { status: "PENDING", createdAt: { lt: urgentCutoff } },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { id: true, trackingId: true, category: true, location: true, createdAt: true, priority: true },
  });
  const allRequests = await prisma.request.findMany({
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, trackingId: true, category: true, location: true, status: true,
      priority: true, upvotes: true, slaDeadline: true, createdAt: true, citizen: { select: { name: true } },
    },
  });
  const activity = await prisma.requestUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true, status: true, note: true, adminName: true, isInternal: true, createdAt: true,
      request: { select: { id: true, trackingId: true, category: true } },
    },
  });

  const countFor = (status: string) => counts.find((item) => item.status === status)?._count._all ?? 0;
  const total = counts.reduce((sum, item) => sum + item._count._all, 0);
  const pending = countFor("PENDING");
  const inProgress = countFor("IN_PROGRESS");
  const resolved = countFor("RESOLVED");
  const categoryData = categories.map((item) => ({ category: item.category, count: item._count._all }));
  const statusData = [
    { name: "Pending" as const, value: pending },
    { name: "In Progress" as const, value: inProgress },
    { name: "Resolved" as const, value: resolved },
  ];
  const tableRequests: RequestTableItem[] = allRequests.map((request) => ({
      ...request,
      priority: priorityValues.includes(request.priority as (typeof priorityValues)[number])
        ? request.priority as RequestTableItem["priority"]
        : "NORMAL",
      overdue: request.status !== "RESOLVED" && request.slaDeadline.getTime() < now.getTime(),
      citizenName: request.citizen.name,
    }));
  const topCommunityRequests = allRequests.filter((request) => request.upvotes > 0).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#0b2342] via-[#0f2c52] to-[#1b4c78] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Municipal operations · Live overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Good day, {session.name || "Admin"}</h1>
          <p className="mt-1.5 text-sm text-blue-100">Track service demand, prioritize urgent reports, and move cases toward resolution.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="hidden items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-blue-50 md:inline-flex"><span className="size-2 rounded-full bg-emerald-400" />Operations dashboard</span>
          <Button className="bg-white text-[#0f2c52] hover:bg-blue-50" nativeButton={false} render={<a download href="/api/admin/reports" />}><Download aria-hidden="true" /> Export</Button>
        </div>
      </header>

      <section aria-label="Service request summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total requests" value={total} icon={ClipboardList} />
        <StatCard label="Awaiting review" value={pending} icon={Clock3} tone="amber" />
        <StatCard label="In progress" value={inProgress} icon={Layers3} tone="navy" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="green" />
      </section>

      <section aria-label="Analytics and action queue" className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:col-span-2">
          <CategoryChart data={categoryData} />
          <StatusChart data={statusData} />
        </div>
        <Card className="border-amber-200/80 shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-amber-100 bg-amber-50/70 pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle aria-hidden="true" className="size-4 text-amber-700" />Needs Attention<span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{urgent.length}</span></CardTitle>
            <p className="text-xs text-slate-600">Pending more than 24 hours</p>
          </CardHeader>
          <CardContent className="p-0">
            {urgent.length ? <ul className="divide-y divide-slate-100">{urgent.map((request) => <li className="flex items-start justify-between gap-3 p-3" key={request.id}>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{request.category}</p><p className="mt-0.5 truncate text-xs text-slate-500">{request.trackingId} · {request.location}</p><p className="mt-1 text-[11px] font-medium text-amber-800">Pending · {Math.floor((now.getTime() - request.createdAt.getTime()) / 3_600_000)}h</p></div>
              <Link className="shrink-0 rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50" href={`/admin/requests/${request.id}`}>Manage</Link>
            </li>)}</ul> : <div className="m-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>No aging cases. All requests are being handled.</span></div>}
            {pending > urgent.length && <Link className="block border-t border-slate-100 px-3 py-2.5 text-center text-xs font-semibold text-[#0f2c52] hover:bg-slate-50" href="/admin/requests?status=PENDING">View all {pending} pending requests</Link>}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border-blue-200 shadow-sm">
        <CardHeader className="border-b border-blue-100 bg-blue-50/60 pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ThumbsUp aria-hidden="true" className="size-4 text-[#0f2c52]" />Top Community Priorities</CardTitle>
          <p className="text-xs text-slate-600">Requests receiving the strongest support from residents</p>
        </CardHeader>
        {topCommunityRequests.length ? (
          <CardContent className="grid gap-3 p-3 md:grid-cols-3">
            {topCommunityRequests.map((request, index) => (
              <Link className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 transition hover:border-blue-300 hover:bg-blue-50/50 ${index === 0 ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white"}`} href={`/admin/requests/${request.id}`} key={request.id}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0f2c52] text-sm font-bold text-white">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{request.category}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{request.location} · {request.trackingId}</span></span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-[#0f2c52]"><ThumbsUp aria-hidden="true" className="size-3.5" />{request.upvotes}</span>
              </Link>
            ))}
          </CardContent>
        ) : (
          <CardContent className="py-6 text-sm text-slate-500">No community votes yet. Requests with resident support will appear here.</CardContent>
        )}
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-900">All Requests</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{total}</span></div><p className="mt-1 text-sm text-slate-500">Community-supported requests first. Select a row to review its timeline.</p></div>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/requests" />}>Advanced filters</Button>
        </div>
        {tableRequests.length ? <RequestTable requests={tableRequests} detailBasePath="/admin/requests" actionLabel="Open" showCitizen showPriority showUpvotes showOverdue quickActions /> : <Card><CardContent className="py-12 text-center text-sm text-slate-500">No service requests have been submitted yet.</CardContent></Card>}
      </section>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Live Activity</CardTitle><p className="text-sm text-slate-500">Most recent case updates across the county</p></CardHeader>
        <CardContent>
          {activity.length ? <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{activity.map((item) => {
            const Icon = item.status === "RESOLVED" ? CheckCircle2 : item.status === "IN_PROGRESS" ? Clock3 : CircleDot;
            const iconClass = item.status === "RESOLVED" ? "text-emerald-600 bg-emerald-50" : item.status === "IN_PROGRESS" ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-100";
            return <li className="relative flex gap-3 rounded-lg border border-slate-100 p-3" key={item.id}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}><Icon aria-hidden="true" className="size-4" /></span>
              <div className="min-w-0"><Link className="text-xs font-semibold text-[#0f2c52] hover:underline" href={`/admin/requests/${item.request.id}`}>{item.request.trackingId}</Link><p className="mt-0.5 text-xs font-medium text-slate-800">{item.status.replaceAll("_", " ")} · {item.request.category}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{item.isInternal ? "Internal note: " : ""}{item.note}</p><p className="mt-1 text-[10px] text-slate-400">{item.adminName} · {formatTimeAgo(item.createdAt)}</p></div>
            </li>;
          })}</ol> : <p className="text-sm text-slate-500">No status updates have been recorded yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
