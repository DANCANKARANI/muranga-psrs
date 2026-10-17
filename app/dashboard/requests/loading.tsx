import { Skeleton } from "@/components/ui/skeleton";

export default function RequestsLoading() {
  return (
    <div aria-label="Loading requests" className="mx-auto max-w-6xl space-y-6" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full sm:w-96" />
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