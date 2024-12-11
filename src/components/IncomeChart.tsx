"use client"
 
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart, ResponsiveContainer } from "recharts"
import { IncomeChartData } from '@/types/chart';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
 } from "@/components/ui/chart"

interface IncomeChartProps {
  chartData: IncomeChartData[];
  isThumbnail?: boolean;
}

export function IncomeChart({ chartData, isThumbnail = false }: IncomeChartProps) {
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

    // For thumbnails, we'll use a subset of the data
    const thumbnailData = isThumbnail ? chartData.filter((_, index) => index % 5 === 0) : chartData;

    return (
        <ChartContainer config={chartConfig} className={isThumbnail ? "h-[100px] w-full" : "min-h-[200px] w-half"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={thumbnailData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide={isThumbnail}
              />
              <YAxis 
                yAxisId="left" 
                label={isThumbnail ? undefined : { value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 0, dy: 0 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                hide={isThumbnail}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={isThumbnail ? undefined : { value: 'Passive Income ($)', angle: 90, position: 'insideRight', dy: 0 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                hide={isThumbnail}
              />
              {!isThumbnail && (
                <>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </>
              )}
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
          </ResponsiveContainer>
        </ChartContainer>
    )
}