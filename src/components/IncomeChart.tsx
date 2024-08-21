"use client"
 
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
 
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
 } from "@/components/ui/chart"
 
const chartData = [
  { year: 2024, balance: 25000, income: 1000 },
  { year: 2025, balance: 47000, income: 1880 },
  { year: 2026, balance: 72390, income: 2896 },
  { year: 2027, balance: 101521, income: 4061 },
  { year: 2028, balance: 134775, income: 5391 },
  { year: 2029, balance: 172570, income: 6903 },
  { year: 2030, balance: 215357, income: 8614 },
  { year: 2031, balance: 263361, income: 10545 },
  { year: 2032, balance: 317928, income: 12717 },
  { year: 2033, balance: 378832, income: 15153 },
  { year: 2034, balance: 446977, income: 17879 },
  { year: 2035, balance: 523052, income: 20922 },
  { year: 2036, balance: 607808, income: 24312 },
  { year: 2037, balance: 702057, income: 28082 },
  { year: 2038, balance: 806683, income: 32267 },

]
 
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
 
export function IncomeChart() {
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