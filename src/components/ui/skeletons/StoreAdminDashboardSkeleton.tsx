import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export function StoreAdminDashboardSkeleton() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[280px] rounded-lg" />
          <Skeleton className="h-4 w-[200px] rounded-md opacity-60" />
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-[300px]">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>
      </div>

      {/* Metrics Row Skeleton - 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="rounded-[2rem] border-none shadow-none bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-3 w-[70px] rounded-full" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2 rounded-lg" />
              <div className="flex gap-2">
                 <Skeleton className="h-3 w-10 rounded-full" />
                 <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid 1: Chart & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-12 gap-8">
        <div className="col-span-1 lg:col-span-2 xl:col-span-8">
            <Card className="rounded-[3rem] border-none shadow-none bg-white dark:bg-slate-900 p-8 h-[450px]">
                <div className="mb-10">
                    <Skeleton className="h-3 w-[120px] mb-2 opacity-50" />
                    <Skeleton className="h-6 w-[200px]" />
                </div>
                <Skeleton className="h-[280px] w-full rounded-2xl" />
            </Card>
        </div>
        <div className="col-span-1 lg:col-span-1 xl:col-span-4">
            <Card className="rounded-[2.5rem] border-none shadow-none bg-white dark:bg-slate-900 p-8 h-[450px]">
                <div className="mb-10">
                    <Skeleton className="h-3 w-[100px] mb-2 opacity-50" />
                    <Skeleton className="h-6 w-[150px]" />
                </div>
                <div className="flex flex-col items-center justify-center space-y-8">
                    <Skeleton className="h-48 w-48 rounded-full" />
                    <div className="w-full space-y-3">
                        <Skeleton className="h-10 w-full rounded-2xl" />
                        <Skeleton className="h-10 w-full rounded-2xl" />
                    </div>
                </div>
            </Card>
        </div>
      </div>

      {/* Main Content Grid 2: Table & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-12 gap-8 mt-8">
        <div className="col-span-1 lg:col-span-2 xl:col-span-8">
            <Card className="rounded-[2rem] border-none shadow-none bg-white dark:bg-slate-900 p-8">
                <Skeleton className="h-5 w-[220px] mb-8" />
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                             <div className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-2 w-20 opacity-50" />
                                </div>
                             </div>
                             <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
        <div className="col-span-1 lg:col-span-1 xl:col-span-4">
            <Card className="rounded-[2rem] border-none shadow-none bg-white dark:bg-slate-900 p-8 h-full">
                <Skeleton className="h-5 w-[180px] mb-8" />
                <div className="space-y-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-2xl" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2 opacity-60" />
                            </div>
                            <Skeleton className="h-2 w-2 rounded-full" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
