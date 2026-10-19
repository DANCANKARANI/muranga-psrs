import { redirect } from "next/navigation";
import { AlertTriangle, Clock3, FileText, Tag, type LucideIcon } from "lucide-react";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { RequestVolumeChart } from "@/components/admin/RequestVolumeChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { getReportRangeLabel, getReportRangeStart, parseReportRange } from "@/lib/report-date-range";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const range = parseReportRange(params.range);
  const now = new Date();
  const rangeStart = getReportRangeStart(range, now);
  const where = rangeStart ? { createdAt: { gte: rangeStart } } : {};

  const totalRequests = await prisma.request.count({ where });
  const categoryGroups = await prisma.request.groupBy({
    by: ["category"],
    where,
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });
  const resolvedRequests = await prisma.request.findMany({
    where: {
      ...where,
      status: "RESOLVED",
      updates: { some: { status: "RESOLVED" } },
    },
    select: {
      createdAt: true,
      updates: {
        where: { status: "RESOLVED" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  const overdueCount = await prisma.request.count({
    where: {
      ...where,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      slaDeadline: { lt: now },
    },
  });

  const resolutionHours = resolvedRequests.flatMap((request) => {
    const resolvedAt = request.updates[0]?.createdAt;
    return resolvedAt ? [(resolvedAt.getTime() - request.createdAt.getTime()) / 3_600_000] : [];
  });
  const averageResolutionHours = resolutionHours.length
    ? (resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length).toFixed(1)
    : null;
  const topCategory = categoryGroups[0];
  const topCategoryLabel = topCategory
    ? `${topCategory.category}: ${Math.round((topCategory._count._all / totalRequests) * 100)}%`
    : "—";
  const categoryData = categoryGroups.map((group) => ({ category: group.category, count: group._count._all }));

  const today = getReportRangeStart("today", now)!;
  const sevenDayStart = new Date(today);
  sevenDayStart.setDate(sevenDayStart.getDate() - 6);
  const recentRequests = await prisma.request.findMany({
    where: { createdAt: { gte: sevenDayStart } },
    select: { createdAt: true },
  });
  const dailyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDayStart);
    date.setDate(date.getDate() + index);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      label: date.toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }),
      count: recentRequests.filter((request) => request.createdAt >= date && request.createdAt < nextDay).length,
    };
  });

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1b5b91]">Service performance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f2c52]">Reports Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Demand, resolution performance, and overdue service requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/reports" className="flex items-center gap-2">
            <label className="sr-only" htmlFor="report-range">Date range</label>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={range} id="report-range" name="range">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <Button type="submit" className="bg-[#0f2c52] text-white hover:bg-[#183d6b]">Apply</Button>
          </form>
          <Button nativeButton={false} render={<a download href={`/api/admin/reports?range=${range}`} />} variant="outline">
            <FileText aria-hidden="true" /> Export CSV
          </Button>
        </div>
      </header>

      <section aria-label="Reports summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Requests" value={totalRequests.toLocaleString()} caption={getReportRangeLabel(range)} icon={FileText} />
        <MetricCard label="Average Resolution Time" value={averageResolutionHours ? `${averageResolutionHours} hrs` : "—"} caption={`${resolutionHours.length} resolved cases with timeline data`} icon={Clock3} />
        <MetricCard label="Top Reported Category" value={topCategoryLabel} caption={getReportRangeLabel(range)} icon={Tag} />
        <MetricCard label="Overdue Count" value={overdueCount.toLocaleString()} caption="Open requests past their SLA" icon={AlertTriangle} tone="red" />
      </section>

      <section aria-label="Request trends" className="grid gap-4 xl:grid-cols-2">
        <CategoryChart data={categoryData} />
        <Card className="min-w-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">Requests submitted per day</CardTitle><p className="text-xs text-slate-500">Daily totals for the last 7 days</p></CardHeader>
          <CardContent><RequestVolumeChart data={dailyData} /></CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone?: "navy" | "red";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0"><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 break-words text-2xl font-bold tabular-nums text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></div>
        <span className={`rounded-lg p-2.5 ${tone === "red" ? "bg-red-50 text-red-700" : "bg-blue-50 text-[#0f2c52]"}`}><Icon aria-hidden="true" className="size-5" /></span>
      </CardContent>
    </Card>
  );
}
