import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
 } from "@/components/ui/chart"

interface SavingsChartProps {
  chartData: {
    year: number;
    balance: number;
    totalSaved: number;
    projectedIncome: number;
  }[];
}

export function SavingsChart({ chartData }: SavingsChartProps) {

    const chartConfig = {
        balance: {
            label: "Balance",
            color: "#2563eb",
        },
        totalSaved: {
            label: "Saved",
            color: "#60a5fa",
        },
        projectedIncome: {
            label: "Passive Income",
            color: "#60a5fa",
        },
        } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-half">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="year" />
        <YAxis 
            yAxisId="left" 
            label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 0, dy: 0, }} 
            tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
            type="monotone"
            dataKey="balance"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            yAxisId="left" 
        />
        <Line 
            type="monotone"
            dataKey="totalSaved"
            stroke="#82ca9d"
            yAxisId="left" 
        />
        <Line
            type="monotone"
            dataKey="projectedIncome"
            stroke="#ffc658"
            yAxisId="left" 
        />
      </LineChart>
    </ChartContainer>
  );
}