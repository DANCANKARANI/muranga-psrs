import { Badge } from "@/components/ui/badge";

const statusStyles = {
  PENDING: "border-slate-200 bg-slate-100 text-slate-700",
  IN_PROGRESS: "border-amber-200 bg-amber-100 text-amber-800",
  RESOLVED: "border-green-200 bg-green-100 text-green-800",
} as const;

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
} as const;

export type RequestStatus = keyof typeof statusStyles;

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusLabels[status]}
    </Badge>
  );
}