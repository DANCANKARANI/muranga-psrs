import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { forbidden, notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AttachmentLinks } from "@/components/shared/AttachmentLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function CitizenRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CITIZEN") redirect("/admin");

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      updates: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" }, select: { id: true, fileName: true } },
    },
  });
  if (!request) notFound();
  if (request.citizenId !== session.id) forbidden();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button className="px-0 text-slate-600" nativeButton={false} render={<Link href="/dashboard/requests" />} variant="link">
        <ArrowLeft aria-hidden="true" />
        Back to my requests
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Tracking number</p>
          <h1 className="mt-1 font-mono text-2xl font-bold tracking-wide text-[#0f2c52] sm:text-3xl">
            {request.trackingId}
          </h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{request.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{request.location}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(request.createdAt)}</p>
            </div>
          </div>
          <AttachmentLinks
            requestId={request.id}
            attachments={request.attachments}
            hasLegacyAttachment={Boolean(request.attachment)}
          />
          <Separator />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Issue description</h2>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {request.updates.length === 0 ? (
            <p className="text-sm leading-6 text-slate-600">
              Your report has been received and is awaiting review.
            </p>
          ) : (
            <ol className="space-y-0">
              {request.updates.map((update, index) => (
                <li className="relative flex gap-4 pb-7 last:pb-0" key={update.id}>
                  {index < request.updates.length - 1 && (
                    <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />
                  )}
                  <span aria-hidden="true" className="relative mt-1 size-4 shrink-0 rounded-full border-4 border-blue-100 bg-[#0f2c52]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={update.status} />
                      <time className="text-xs text-slate-500" dateTime={update.createdAt.toISOString()}>
                        {formatDate(update.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}