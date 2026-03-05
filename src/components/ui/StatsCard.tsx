import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label: string;
  };
  iconColorClass?: string;
  iconBgClass?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconColorClass = "text-indigo-600",
  iconBgClass = "bg-indigo-50",
}) => {
  return (
    <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group h-36 sm:h-40 flex flex-col justify-between">
      <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${iconColorClass}`}>
        <Icon size={80} />
      </div>
      
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-slate-500 font-bold text-xs sm:text-sm tracking-wide uppercase">
            {title}
          </CardTitle>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 mt-auto">
        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {value}
        </div>
        
        {(description || trend) && (
          <CardDescription className="text-[10px] sm:text-xs font-bold flex items-center">
            {trend && (
              <span className={`mr-1.5 px-2 py-0.5 rounded-md ${trend.isPositive ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-slate-400">{description}</span>}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};
