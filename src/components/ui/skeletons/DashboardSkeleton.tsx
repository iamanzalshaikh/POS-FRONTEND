import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-[250px] rounded-xl" />
        <Skeleton className="h-10 w-[150px] rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-none bg-slate-50/50 dark:bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-3 w-[80px] rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[100px] mb-2 rounded-lg" />
              <Skeleton className="h-2 w-[120px] rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border border-slate-100 dark:border-slate-800 shadow-none rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-2xl" />
          </CardContent>
        </Card>
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
