import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRequestsLoading() {
  return (
    <div aria-label="Loading all requests" className="mx-auto max-w-7xl space-y-6" role="status">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full sm:w-52" />
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton className="h-10 w-full" key={index} />
        ))}
      </div>
    </div>
  );
}
