import { UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { UpvoteButton } from "@/components/requests/UpvoteButton";
import { PriorityBadge, type RequestPriority } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const instant = false;

export default async function CommunityRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  const requests = await prisma.request.findMany({
    where: { citizenId: { not: session.id } },
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      trackingId: true,
      category: true,
      location: true,
      status: true,
      priority: true,
      upvotes: true,
      upvotedBy: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1b5b91]">Community support</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0f2c52]">Community requests</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Support issues reported by other residents. Your own requests are excluded, and citizen identities are kept private.</p>
      </header>

      {requests.length ? (
        <section aria-label="Requests from other residents" className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <Card className="min-w-0" key={request.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{request.category}</p>
                    <p className="mt-1 truncate text-sm text-slate-600">{request.location}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{request.trackingId}</p>
                  </div>
                  <UsersRound aria-hidden="true" className="size-5 shrink-0 text-slate-400" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority as RequestPriority} />
                    <time className="text-xs text-slate-500" dateTime={request.createdAt.toISOString()}>{formatDate(request.createdAt)}</time>
                  </div>
                  <UpvoteButton
                    requestId={request.id}
                    initialCount={request.upvotes}
                    initiallyUpvoted={request.upvotedBy.includes(session.id)}
                    isOwner={false}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <Card><CardContent className="py-14 text-center"><UsersRound aria-hidden="true" className="mx-auto size-8 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">No community requests yet</p><p className="mt-1 text-sm text-slate-500">New reports from other residents will appear here.</p></CardContent></Card>
      )}
    </div>
  );
}
