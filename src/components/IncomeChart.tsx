"use client"
 
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { ChartData } from '@/types/chart';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
 } from "@/components/ui/chart"

export function IncomeChart({ chartData }: { chartData: ChartData }) {
    
    const chartConfig = {
    balance: {
        label: "Balance",
        color: "#2563eb",
    },
    conservativeIncome: {
        label: "Passive Income",
        color: "#60a5fa",
    },
    } satisfies ChartConfig

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-half">
          <ComposedChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                />
            <YAxis 
                yAxisId="left" 
                label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 0, dy: 0, }} 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Passive Income ($)', angle: 90, position: 'insideRight', dy: 0, }} 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
                type="monotone" 
                dataKey="balance" 
                stroke="var(--color-balance)"
                strokeWidth={2} 
                yAxisId="left" 
                dot={false}
            />
            <Bar 
                dataKey="conservativeIncome" 
                fill="var(--color-conservativeIncome)" 
                radius={4} 
                yAxisId="right" 
            />
          </ComposedChart>
        </ChartContainer>
    )
}