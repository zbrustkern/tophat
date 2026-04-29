"use client"
 
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart, ResponsiveContainer, Area } from "recharts"
import { CollegeChartData } from '@/types/chart';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
 } from "@/components/ui/chart"

interface CollegeChartProps {
  chartData: CollegeChartData[];
  isThumbnail?: boolean;
}

export function CollegeChart({ chartData, isThumbnail = false }: CollegeChartProps) {
    const chartConfig = {
      balance: {
        label: "Total Balance",
        color: "#2563eb",
      },
      totalContributions: {
        label: "Total Contributions",
        color: "#3b82f6",
      },
      projectedCost: {
        label: "Target Amount",
        color: "#f59e0b",
      },
    } satisfies ChartConfig

    // For thumbnails, we'll use a subset of the data
    const thumbnailData = isThumbnail ? chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 5)) === 0) : chartData;

    return (
        <ChartContainer config={chartConfig} className={isThumbnail ? "h-[100px] w-full" : "min-h-[200px] w-half"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={thumbnailData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="age"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide={isThumbnail}
                label={isThumbnail ? undefined : { value: 'Child Age', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left" 
                label={isThumbnail ? undefined : { value: 'Amount ($)', angle: -90, position: 'insideLeft', offset: 0, dy: 0 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                hide={isThumbnail}
              />
              {!isThumbnail && (
                <>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </>
              )}
              <Area
                type="monotone"
                dataKey="totalContributions"
                fill="var(--color-totalContributions)"
                stroke="var(--color-totalContributions)"
                yAxisId="left"
                fillOpacity={0.4}
              />
              <Line
                type="monotone" 
                dataKey="balance" 
                stroke="var(--color-balance)"
                strokeWidth={3} 
                yAxisId="left" 
                dot={false}
              />
              <Line
                type="stepAfter" 
                dataKey="projectedCost" 
                stroke="var(--color-projectedCost)"
                strokeWidth={2} 
                strokeDasharray="5 5"
                yAxisId="left" 
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
    )
}