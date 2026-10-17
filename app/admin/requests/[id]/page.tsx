import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminUpdateForm } from "@/components/admin/AdminUpdateForm";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      citizen: { select: { id: true, name: true, email: true } },
      updates: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Button className="px-0 text-slate-600" nativeButton={false} render={<Link href="/admin" />} variant="link">
        <ArrowLeft aria-hidden="true" />
        Back to all requests
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Tracking number</p>
          <h1 className="mt-1 font-mono text-2xl font-bold tracking-wide text-[#0f2c52] sm:text-3xl">
            {request.trackingId}
          </h1>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Municipal service report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Citizen</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{request.citizen.name}</p>
                  <p className="text-sm text-slate-600">{request.citizen.email}</p>
                </div>
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
                {request.attachment && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachment</p>
                    <a className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[#0f2c52] underline-offset-4 hover:underline" href={request.attachment} rel="noreferrer" target="_blank">
                      <FileText aria-hidden="true" className="size-4" />
                      View supporting document
                    </a>
                  </div>
                )}
              </div>
              <Separator />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Issue description</p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Progress timeline</CardTitle></CardHeader>
            <CardContent>
              {request.updates.length === 0 ? (
                <p className="text-sm leading-6 text-slate-600">No administrative updates have been recorded.</p>
              ) : (
                <ol className="space-y-0">
                  {request.updates.map((update, index) => (
                    <li className="relative flex gap-4 pb-7 last:pb-0" key={update.id}>
                      {index < request.updates.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                      <span aria-hidden="true" className="relative mt-1 size-4 shrink-0 rounded-full border-4 border-blue-100 bg-[#0f2c52]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={update.status} />
                          <time className="text-xs text-slate-500" dateTime={update.createdAt.toISOString()}>{formatDate(update.createdAt)}</time>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Updated by {update.adminName}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.note}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Update request</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUpdateForm requestId={request.id} currentStatus={request.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}