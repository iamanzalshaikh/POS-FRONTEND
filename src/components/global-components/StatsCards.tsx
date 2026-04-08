"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface StatItem {
  name: string;
  stat: string;
  change?: string;
  changeType?: "positive" | "negative";
}

interface Stats03Props {
  data: StatItem[];
}

export default function Stats03({ data }: Stats03Props) {
  if (!data || data.length === 0) return null;

  const gridCols = data.length === 5 ? 'lg:grid-cols-5' : data.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <div className="w-full">
      <dl className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 w-full", gridCols)}>
        {data.map((item) => (
          <Card key={item.name} className="p-6 rounded-[24px] border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-0">
              <dt className="text-xs font-medium text-slate-500 mb-2">{item.name}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums pb-1">
                  {item.stat}
                </span>
                {item.change && (
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      item.changeType === "positive" ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {item.changeType === "positive" ? '+' : ''}{item.change}
                  </span>
                )}
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}
