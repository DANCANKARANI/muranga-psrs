import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminStatusFilter } from "@/components/shared/AdminStatusFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestTable } from "@/components/shared/RequestTable";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = ["PENDING", "IN_PROGRESS", "RESOLVED"] as const;

interface AdminRequestsPageProps {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>;
}

export default async function AdminRequestsPage({
  searchParams,
}: AdminRequestsPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = statuses.includes(statusParam as (typeof statuses)[number])
    ? (statusParam as (typeof statuses)[number])
    : undefined;
  const queryParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = queryParam?.trim().slice(0, 120);

  const requests = await prisma.request.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(query ? {
        OR: [
          { trackingId: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          { citizen: { name: { contains: query, mode: "insensitive" } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { citizen: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">All Requests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Filter and manage all municipal service reports.{query ? ` Matching “${query}”.` : ""}
          </p>
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
    </div>
  );
}
