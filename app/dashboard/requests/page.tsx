import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestFilters } from "@/components/shared/RequestFilters";
import { RequestTable } from "@/components/shared/RequestTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
    select: {
      id: true,
      citizenId: true,
      trackingId: true,
      category: true,
      location: true,
      description: true,
      status: true,
      priority: true,
      upvotes: true,
      upvotedBy: true,
      slaDeadline: true,
      createdAt: true,
    },
  });
  const now = new Date().getTime();
  const tableRequests = requests.map(({ upvotedBy, citizenId, ...request }) => ({
    ...request,
    isOwner: citizenId === session.id,
    hasUpvoted: upvotedBy.includes(session.id),
    overdue: request.status !== "RESOLVED" && request.slaDeadline.getTime() < now,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f2c52]">
            My requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your own requests are shown here. Visit Community Requests to support issues reported by other residents.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/community" />} variant="outline">Explore community requests</Button>
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
          <RequestTable requests={tableRequests} showDescription showUpvotes allowUpvotes showOverdue />
      )}
    </div>
  );
}
