import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "./TableSkeleton";

export function ManagementPageSkeleton({ cards = 4, columns = 6 }) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-10 w-[250px] rounded-xl" />
        <Skeleton className="h-4 w-[400px] rounded-lg" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-32 rounded-[2rem] bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <Skeleton className="size-12 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Table Section Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6">
        <div className="flex items-center justify-between mb-8 px-4">
           <div className="flex gap-4">
             <Skeleton className="h-10 w-60 rounded-xl" />
             <Skeleton className="h-10 w-32 rounded-xl" />
             <Skeleton className="h-10 w-32 rounded-xl" />
           </div>
           <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <TableSkeleton columns={columns} rows={8} />
      </div>
    </div>
  );
}
