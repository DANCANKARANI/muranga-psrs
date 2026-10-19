import { Badge } from "@/components/ui/badge";

export type RequestPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

const styles: Record<RequestPriority, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-blue-200 bg-blue-50 text-blue-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800",
  CRITICAL: "border-red-200 bg-red-50 text-red-800",
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <Badge variant="outline" className={styles[priority]}>{label}</Badge>;
}
