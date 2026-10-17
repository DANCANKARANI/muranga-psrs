import { Skeleton } from "@/components/ui/skeleton";

export default function RequestsLoading() {
  return (
    <div aria-label="Loading requests" className="mx-auto max-w-6xl space-y-6" role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full sm:w-96" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}