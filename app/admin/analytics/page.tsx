import { redirect } from "next/navigation";
import { Activity, CheckCircle2, Clock3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RequestVolumeChart } from "@/components/admin/RequestVolumeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

type DateRange = "week" | "month" | "all";
const dayMs = 24 * 60 * 60 * 1000;

function rangeStart(range: DateRange, now: Date): Date | undefined {
  if (range === "all") return undefined;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "week") {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else {
    start.setDate(1);
  }
  return start;
}

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string | string[] }>;
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");
  const params = await searchParams;
  const rangeParam = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: DateRange = rangeParam === "week" || rangeParam === "month" ? rangeParam : "all";
  const now = new Date();
  const start = rangeStart(range, now);
  const where = start ? { createdAt: { gte: start } } : {};

  const resolvedRequests = await prisma.request.findMany({
    where: { ...where, status: "RESOLVED", updates: { some: { status: "RESOLVED" } } },
    select: { createdAt: true, updates: { where: { status: "RESOLVED" }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
  });
  const resolvedCount = await prisma.request.count({ where: { ...where, status: "RESOLVED" } });
  const pendingCount = await prisma.request.count({ where: { ...where, status: "PENDING" } });
  const submitted = await prisma.request.findMany({ where, select: { createdAt: true } });

  const durationDays = resolvedRequests.flatMap((request) => {
    const firstResolvedUpdate = request.updates[0];
    return firstResolvedUpdate ? [(firstResolvedUpdate.createdAt.getTime() - request.createdAt.getTime()) / dayMs] : [];
  });
  const averageDays = durationDays.length
    ? (durationDays.reduce((sum, days) => sum + days, 0) / durationDays.length).toFixed(1)
    : null;

  const useMonths = range === "all";
  const binCount = useMonths ? 12 : range === "week" ? 7 : Math.max(1, now.getDate());
  const bins = Array.from({ length: binCount }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    if (useMonths) {
      date.setDate(1);
      date.setMonth(date.getMonth() - (binCount - 1 - index));
      return { date, end: new Date(date.getFullYear(), date.getMonth() + 1, 1), label: date.toLocaleDateString("en-KE", { month: "short", year: "2-digit" }) };
    }
    if (range === "week") {
      const monday = rangeStart("week", now)!;
      date.setTime(monday.getTime());
      date.setDate(date.getDate() + index);
    } else {
      date.setDate(index + 1);
    }
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    return { date, end, label: date.toLocaleDateString("en-KE", { day: "numeric", month: "short" }) };
  });
  const chartData = bins.map(({ date, end, label }) => ({
    label,
    count: submitted.filter((request) => request.createdAt >= date && request.createdAt < end).length,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-[#1b5b91]">Service performance</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f2c52]">Analytics</h1><p className="mt-2 text-sm text-slate-600">Resolution performance and incoming request trends.</p></div>
        <form action="/admin/analytics" className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="range">Date range</label>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={range} id="range" name="range">
            <option value="week">This week</option><option value="month">This month</option><option value="all">All time</option>
          </select>
          <button className="h-10 rounded-md bg-[#0f2c52] px-3 text-sm font-semibold text-white" type="submit">Apply</button>
        </form>
      </div>

      <section aria-label="Analytics summary" className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Average resolution time" value={averageDays ? `${averageDays} days` : "—"} caption={`${durationDays.length} resolved requests with a timeline`} icon={Clock3} />
        <MetricCard label="Total resolved" value={resolvedCount.toLocaleString()} caption="Requests resolved in this range" icon={CheckCircle2} />
        <MetricCard label="Total pending" value={pendingCount.toLocaleString()} caption="Requests awaiting review" icon={Activity} />
      </section>

      <Card>
        <CardHeader><CardTitle className="text-base">Requests submitted over time</CardTitle><p className="text-sm text-slate-500">{range === "all" ? "Monthly totals for the last 12 months" : range === "week" ? "Daily totals for this week" : "Daily totals for this month"}</p></CardHeader>
        <CardContent><RequestVolumeChart data={chartData} /></CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, caption, icon: Icon }: { label: string; value: string; caption: string; icon: LucideIcon }) {
  return <Card><CardContent className="flex items-start justify-between gap-4 p-5"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></div><span className="rounded-lg bg-blue-50 p-2.5 text-[#0f2c52]"><Icon aria-hidden="true" className="size-5" /></span></CardContent></Card>;
}
