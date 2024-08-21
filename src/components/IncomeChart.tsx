"use client"
 
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
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
    income: {
        label: "Income",
        color: "#60a5fa",
    },
    } satisfies ChartConfig
 

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-half">
        <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="balance" fill="var(--color-balance)" radius={4} />
            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        </BarChart>
        </ChartContainer>
    )
}