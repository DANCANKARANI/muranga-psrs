import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard" className="mx-auto max-w-6xl space-y-8" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-24 rounded-xl" key={index} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="mb-5 h-6 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}