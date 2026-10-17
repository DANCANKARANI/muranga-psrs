import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestFilters } from "@/components/shared/RequestFilters";
import { RequestTable } from "@/components/shared/RequestTable";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
] as const;

interface RequestsPageProps {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>;
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  const params = await searchParams;
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim();
  const status = statuses.includes(requestedStatus as (typeof statuses)[number])
    ? (requestedStatus as (typeof statuses)[number])
    : undefined;
  const requests = await prisma.request.findMany({
    where: {
      citizenId: session.id,
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { trackingId: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
          My requests
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Search your reports by tracking number, location, or description, or filter by status.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-10 w-full sm:w-96" />}>
        <RequestFilters />
      </Suspense>
      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests found"
          description="Try changing the search or status filter, or report a municipal service issue."
          actionHref="/dashboard/requests/new"
          actionLabel="Submit a request"
        />
      ) : (
          <RequestTable requests={requests} showDescription />
      )}
    </div>
  );
}