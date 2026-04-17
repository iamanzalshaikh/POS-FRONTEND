import { Skeleton } from "@/components/ui/skeleton";

export function StaffDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-4 w-32 rounded-full" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-40 rounded-2xl" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-[2rem] bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <Skeleton className="size-12 rounded-2xl" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Col: Ledger Skeleton */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
            <Skeleton className="size-12 rounded-full" />
          </div>
          <div className="space-y-4 pt-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex justify-between items-center p-4 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Col: Admin Info Skeleton */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6">
              <Skeleton className="h-4 w-40 rounded-full" />
              <div className="space-y-4">
                 <Skeleton className="h-14 w-full rounded-2xl" />
                 <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="p-6 space-y-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-2 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24 rounded-full" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
