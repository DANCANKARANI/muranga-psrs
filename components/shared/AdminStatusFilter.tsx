"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  ["all", "All statuses"],
  ["PENDING", "Pending"],
  ["IN_PROGRESS", "In Progress"],
  ["RESOLVED", "Resolved"],
] as const;

export function AdminStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";

  function updateStatus(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete("status");
    else params.set("status", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={status} onValueChange={updateStatus}>
      <SelectTrigger aria-label="Filter requests by status" className="h-10 w-full sm:w-52">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}