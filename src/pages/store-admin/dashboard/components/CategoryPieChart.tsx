import GlobalPieChart from '@/components/global-components/PieChart';

interface CategoryPieChartProps {
    data: { name: string; value: number; color: string }[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
    return (
        <GlobalPieChart
            data={data}
            dataKey="value"
            nameKey="name"
            title="Sales by Category"
            subtitle="Donut breakdown of payment groups"
            compact
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            centerLabel={data.length}
            showLabels={false}
        />
    );
}
