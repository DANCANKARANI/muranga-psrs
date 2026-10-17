"use client";

import { useRef, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function RequestFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchFormRef = useRef<HTMLFormElement>(null);
  const status = searchParams.get("status") ?? "all";

  function currentQuery() {
    return searchFormRef.current?.querySelector<HTMLInputElement>("[name=q]")?.value ?? "";
  }

  function updateUrl(nextStatus: string, nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl(status, currentQuery());
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select
        value={status}
        onValueChange={(value) => updateUrl(value ?? "all", currentQuery())}
      >
        <SelectTrigger aria-label="Filter by status" className="h-10 w-full sm:w-52">
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
      <form className="flex flex-1 gap-2" onSubmit={handleSearch} ref={searchFormRef}>
        <Input
          aria-label="Search tracking ID, description, or location"
          className="h-10 min-w-0"
          defaultValue={searchParams.get("q") ?? ""}
          name="q"
          placeholder="Search tracking ID, description, or location"
        />
        <Button
          aria-label="Search requests"
          className="h-10 bg-[#0f2c52] text-white hover:bg-[#183d6b]"
          type="submit"
        >
          <Search aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">Search</span>
        </Button>
      </form>
    </div>
  );
}