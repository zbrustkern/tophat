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
  secondaryChartData?: IncomeChartData[];
  isThumbnail?: boolean;
}

export function IncomeChart({ chartData, secondaryChartData, isThumbnail = false }: IncomeChartProps) {
    const chartConfig = {
      balance: {
        label: "Balance",
        color: "#2563eb",
      },
      conservativeIncome: {
        label: "Passive Income",
        color: "#60a5fa",
      },
      secondaryBalance: {
        label: "Comparison Balance",
        color: "#93c5fd",
      },
      secondaryConservativeIncome: {
        label: "Comparison Income",
        color: "#bfdbfe",
      },
    } satisfies ChartConfig

    const mergedData = chartData.map((primaryPoint, index) => {
      const secondaryPoint = secondaryChartData?.[index];
      return {
        ...primaryPoint,
        secondaryBalance: secondaryPoint?.balance,
        secondaryConservativeIncome: secondaryPoint?.conservativeIncome
      };
    });

    // For thumbnails, we'll use a subset of the data
    const thumbnailData = isThumbnail ? mergedData.filter((_, index) => index % 5 === 0) : mergedData;

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
              {secondaryChartData && (
                <Line
                  type="monotone" 
                  dataKey="secondaryBalance" 
                  stroke="var(--color-secondaryBalance)"
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  yAxisId="left" 
                  dot={false}
                />
              )}
              {secondaryChartData && (
                <Bar 
                  dataKey="secondaryConservativeIncome" 
                  fill="var(--color-secondaryConservativeIncome)" 
                  radius={4} 
                  yAxisId="right" 
                  fillOpacity={0.6}
                />
              )}
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