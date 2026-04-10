"use client";

import { cn } from "@/lib/utils";
import MetricCard from "./MetricCard";
import { BarChart3 } from "lucide-react";

export interface StatItem {
  name: string;
  stat: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon?: any;
  colorClass?: string;
}

interface Stats03Props {
  data: StatItem[];
}

export default function Stats03({ data }: Stats03Props) {
  if (!data || data.length === 0) return null;

  const gridCols = data.length === 5 ? 'lg:grid-cols-5' : data.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <div className="w-full">
      <dl className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 w-full", gridCols)}>
        {data.map((item) => (
          <MetricCard
            key={item.name}
            title={item.name}
            value={item.stat}
            icon={item.icon || BarChart3}
            colorClass={item.colorClass || (item.changeType === "positive" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400")}
          />
        ))}
      </dl>
    </div>
  );
}
