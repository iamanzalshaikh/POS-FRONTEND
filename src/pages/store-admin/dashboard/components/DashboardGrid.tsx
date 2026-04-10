import type { ReactNode } from 'react';

interface DashboardGridProps {
    children: ReactNode;
}

export default function DashboardGrid({ children }: DashboardGridProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-12 gap-4 animate-fade-in relative z-0 flex-1 overflow-y-visible">
            {children}
        </div>
    );
}
