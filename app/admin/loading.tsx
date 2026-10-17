import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div aria-label="Loading administration" className="mx-auto max-w-7xl space-y-8" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-24 rounded-xl" key={index} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="mb-5 h-6 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}