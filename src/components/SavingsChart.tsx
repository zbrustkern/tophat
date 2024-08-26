import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SavingsChartProps {
  chartData: {
    year: number;
    balance: number;
    totalSaved: number;
    projectedIncome: number;
  }[];
}

export function SavingsChart({ chartData }: SavingsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="balance" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="totalSaved" stroke="#82ca9d" />
        <Line type="monotone" dataKey="projectedIncome" stroke="#ffc658" />
      </LineChart>
    </ResponsiveContainer>
  );
}