import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestTable } from "@/components/shared/RequestTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  const requests = await prisma.request.findMany({
    where: { citizenId: session.id },
    orderBy: { createdAt: "desc" },
    include: { updates: true },
  });
  const open = requests.filter((request) =>
    ["PENDING", "IN_PROGRESS"].includes(request.status),
  ).length;
  const now = new Date();
  const overdue = requests.filter(
    (request) => request.status !== "RESOLVED" && request.slaDeadline.getTime() < now.getTime(),
  ).length;
  const resolved = requests.filter((request) => request.status === "RESOLVED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
            My Requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Report and track municipal service issues in Murang&apos;a County.
          </p>
        </div>
        <Button
          className="bg-[#0f2c52] text-white hover:bg-[#183d6b]"
          nativeButton={false}
          render={<Link href="/dashboard/requests/new" />}
        >
          <Plus aria-hidden="true" />
          New request
        </Button>
      </div>

      <section aria-label="Request summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total" value={requests.length} icon={ClipboardList} />
        <StatCard
          label="Open"
          value={open}
          icon={Clock3}
          tone="amber"
          description={`You have ${overdue} overdue ${overdue === 1 ? "request" : "requests"}`}
          descriptionTone={overdue ? "danger" : "default"}
        />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="green" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent reports</h2>
            <p className="mt-1 text-sm text-slate-600">Your latest municipal service reports.</p>
          </div>
          {requests.length > 0 && (
            <Button nativeButton={false} render={<Link href="/dashboard/requests" />} variant="outline">
              View all <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            description="When you report a municipal service issue, it will appear here with its tracking information."
            actionHref="/dashboard/requests/new"
            actionLabel="Submit your first request"
          />
        ) : (
          <RequestTable requests={requests.slice(0, 8)} />
        )}
      </section>
    </div>
  );
}
