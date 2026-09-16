import { Skeleton } from "@/components/ui/skeleton";

/** Route-level fallback shown while a main page's server work resolves. */
export default function Loading() {
  return (
    <div className="animate-slide-up space-y-4 pt-2">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
