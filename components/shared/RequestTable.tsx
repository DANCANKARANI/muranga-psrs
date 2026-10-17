import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type RequestStatus } from "@/components/shared/StatusBadge";
import { formatDate, truncate } from "@/lib/utils";

export interface RequestTableItem {
  id: string;
  trackingId: string;
  category: string;
  location: string;
  description?: string;
  status: RequestStatus;
  createdAt: Date;
  citizenName?: string;
}

interface RequestTableProps {
  requests: RequestTableItem[];
  detailBasePath?: string;
  showCitizen?: boolean;
  showDescription?: boolean;
  actionLabel?: string;
}

export function RequestTable({
  requests,
  detailBasePath = "/dashboard/requests",
  showCitizen = false,
  showDescription = false,
  actionLabel = "View",
}: RequestTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Tracking ID</TableHead>
            {showCitizen && <TableHead>Citizen</TableHead>}
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            {showDescription && <TableHead>Description</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">{actionLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
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
                <TableCell className="max-w-64 text-slate-600">
                  {truncate(request.description ?? "")}
                </TableCell>
              )}
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-slate-600">
                {formatDate(request.createdAt)}
              </TableCell>
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