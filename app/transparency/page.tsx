import Link from "next/link";
import { connection } from "next/server";
import { Activity, ArrowLeft, CheckCircle2, ClipboardList, MapPin, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTimeAgo } from "@/lib/utils";

export const instant = false;

export default async function TransparencyPage() {
  await connection();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const totalRequests = await prisma.request.count();
  const resolvedThisMonth = await prisma.request.count({
    where: {
      status: "RESOLVED",
      updates: { some: { status: "RESOLVED", createdAt: { gte: monthStart } } },
    },
  });
  const topCategories = await prisma.request.groupBy({
    by: ["category"],
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
    take: 1,
  });
  const activity = await prisma.requestUpdate.findMany({
    where: { isInternal: false },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      status: true,
      createdAt: true,
      request: { select: { category: true, location: true, upvotes: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1b5b91]">Murang’a County</p>
            <p className="mt-0.5 text-sm font-semibold text-[#0f2c52]">Public Service Transparency</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2c52] hover:underline" href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />Portal home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-2xl bg-gradient-to-r from-[#0b2342] via-[#0f2c52] to-[#1b4c78] p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Open county service data</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Transparency Board</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">A public view of service requests and progress across the county. Citizen names and private administrative notes are not shown.</p>
        </section>

        <section aria-label="County service request statistics" className="grid gap-4 md:grid-cols-3">
          <TransparencyMetric icon={ClipboardList} label="Total county requests" value={totalRequests.toLocaleString()} caption="All reports submitted through the portal" />
          <TransparencyMetric icon={CheckCircle2} label="Resolved this month" value={resolvedThisMonth.toLocaleString()} caption={`Since ${formatDate(monthStart).split(",")[0]}`} />
          <TransparencyMetric icon={Activity} label="Top service category" value={topCategories[0]?.category ?? "No data yet"} caption={topCategories[0] ? `${topCategories[0]._count._all.toLocaleString()} submitted requests` : "Categories will appear as requests arrive"} />
        </section>

        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Activity aria-hidden="true" className="size-5 text-[#1b5b91]" />Recent public activity</CardTitle>
            <p className="text-sm text-slate-500">Latest public status updates; personal information is omitted.</p>
          </CardHeader>
          <CardContent className="p-0">
            {activity.length ? (
              <ol className="divide-y divide-slate-100">
                {activity.map((item) => (
                  <li className="flex items-start gap-3 px-5 py-4" key={item.id}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0f2c52]"><MapPin aria-hidden="true" className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-6 text-slate-800">A {item.request.category.toLowerCase()} issue in <span className="font-semibold">{item.request.location}</span> was updated to <span className="font-semibold">{item.status.replaceAll("_", " ").toLowerCase()}</span>.</p>
                      <time className="mt-1 block text-xs text-slate-500" dateTime={item.createdAt.toISOString()}>{formatTimeAgo(item.createdAt)}</time>
                    </div>
                    <span aria-label={`${item.request.upvotes} community upvotes`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0f2c52]"><ThumbsUp aria-hidden="true" className="size-3.5" />{item.request.upvotes}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-slate-500">No public status updates have been recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs leading-5 text-slate-500">Statistics update from submitted service request data. The activity feed omits citizen identities and internal notes.</p>
      </div>
    </main>
  );
}

function TransparencyMetric({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <span className="rounded-lg bg-blue-50 p-2.5 text-[#0f2c52]"><Icon aria-hidden="true" className="size-5" /></span>
      </CardContent>
    </Card>
  );
}
