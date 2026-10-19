"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MoreHorizontal, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type RequestStatus } from "@/components/shared/StatusBadge";
import { PriorityBadge, type RequestPriority } from "@/components/shared/PriorityBadge";
import { UpvoteButton } from "@/components/requests/UpvoteButton";
import { formatDate, truncate } from "@/lib/utils";

export interface RequestTableItem {
  id: string;
  trackingId: string;
  category: string;
  location: string;
  description?: string;
  status: RequestStatus;
  priority?: RequestPriority | string;
  upvotes?: number;
  hasUpvoted?: boolean;
  isOwner?: boolean;
  overdue?: boolean;
  createdAt: Date;
  citizenName?: string;
}

interface RequestTableProps {
  requests: RequestTableItem[];
  detailBasePath?: string;
  showCitizen?: boolean;
  showDescription?: boolean;
  actionLabel?: string;
  quickActions?: boolean;
  showPriority?: boolean;
  showOverdue?: boolean;
  showUpvotes?: boolean;
  allowUpvotes?: boolean;
}

export function RequestTable({
  requests,
  detailBasePath = "/dashboard/requests",
  showCitizen = false,
  showDescription = false,
  actionLabel = "View",
  quickActions = false,
  showPriority = false,
  showOverdue = false,
  showUpvotes = false,
  allowUpvotes = false,
}: RequestTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function quickUpdate(
    event: React.MouseEvent,
    requestId: string,
    status: "IN_PROGRESS" | "RESOLVED",
  ) {
    event.stopPropagation();
    setPendingId(requestId);
    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: "Status updated via quick action",
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "The request could not be updated.";
        toast.error(message);
        return;
      }
      toast.success("Request updated");
      router.refresh();
    } catch {
      toast.error("The request could not be updated. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table className="min-w-max">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Tracking ID</TableHead>
            {showCitizen && <TableHead>Citizen</TableHead>}
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            {showDescription && <TableHead>Description</TableHead>}
            {showPriority && <TableHead>Priority</TableHead>}
            {showUpvotes && <TableHead>Upvotes</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {quickActions && <TableHead>Quick Actions</TableHead>}
            <TableHead className="text-right">{actionLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              className="cursor-pointer hover:bg-blue-50/60"
              key={request.id}
              onClick={() => router.push(`${detailBasePath}/${request.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`${detailBasePath}/${request.id}`);
                }
              }}
              role="link"
              tabIndex={0}
            >
              <TableCell className="font-mono text-xs font-medium text-[#0f2c52]">
                {request.trackingId}
              </TableCell>
              {showCitizen && (
                <TableCell className="max-w-40 truncate">
                  {request.citizenName ?? "—"}
                </TableCell>
              )}
              <TableCell>{request.category}</TableCell>
              <TableCell className="max-w-52 truncate font-medium text-slate-900">
                {request.location}
              </TableCell>
              {showDescription && (
                <TableCell className="w-64 max-w-64 text-slate-600">
                  <span className="block max-w-64 truncate" title={request.description ?? ""}>
                    {truncate(request.description ?? "")}
                  </span>
                </TableCell>
              )}
              {showPriority && <TableCell>{request.priority ? <PriorityBadge priority={(["LOW", "NORMAL", "HIGH", "CRITICAL"].includes(request.priority) ? request.priority : "NORMAL") as RequestPriority} /> : "—"}</TableCell>}
              {showUpvotes && (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  {allowUpvotes ? (
                    <UpvoteButton requestId={request.id} initialCount={request.upvotes ?? 0} initiallyUpvoted={request.hasUpvoted ?? false} isOwner={request.isOwner ?? false} />
                  ) : (
                    <span className="font-semibold tabular-nums text-slate-700">{request.upvotes ?? 0}</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={request.status} />
                  {showOverdue && request.overdue && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">OVERDUE</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">
                {formatDate(request.createdAt)}
              </TableCell>
              {quickActions && (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          aria-label={`Quick actions for ${request.trackingId}`}
                          disabled={pendingId === request.id}
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      {pendingId === request.id ? (
                        <LoaderCircle aria-hidden="true" className="animate-spin" />
                      ) : (
                        <MoreHorizontal aria-hidden="true" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={pendingId === request.id}
                        onClick={(event) => void quickUpdate(event, request.id, "IN_PROGRESS")}
                      >
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pendingId === request.id}
                        onClick={(event) => void quickUpdate(event, request.id, "RESOLVED")}
                      >
                        Mark Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
              <TableCell className="text-right">
                <Link
                  aria-label={`${actionLabel} request ${request.trackingId}`}
                  className="inline-flex size-8 items-center justify-center rounded-md text-[#0f2c52] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2c52]"
                  href={`${detailBasePath}/${request.id}`}
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
