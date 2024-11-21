"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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
  isThumbnail?: boolean;
}

export function SavingsChart({ chartData, isThumbnail = false }: SavingsChartProps) {
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
            label: "Passive Income $",
            color: "#ffc658",
        },
    } satisfies ChartConfig

    // For thumbnails, we'll use a subset of the data
    const thumbnailData = isThumbnail ? chartData.filter((_, index) => index % 5 === 0) : chartData;

    return (
        <ChartContainer config={chartConfig} className={isThumbnail ? "h-[100px] w-full" : "min-h-[200px] w-half"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={thumbnailData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="year" hide={isThumbnail} />
              <YAxis 
                yAxisId="left" 
                label={isThumbnail ? undefined : { value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 0, dy: 0 }}
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
                stroke={chartConfig.balance.color}
                activeDot={{ r: 8 }}
                yAxisId="left" 
              />
              <Line 
                type="monotone"
                dataKey="totalSaved"
                stroke={chartConfig.totalSaved.color}
                yAxisId="left" 
              />
              <Line
                type="monotone"
                dataKey="projectedIncome"
                stroke={chartConfig.projectedIncome.color}
                yAxisId="left" 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
    );
}