import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react';
import { IncomeChart } from '@/components/IncomeChart';
import { SavingsChart } from '@/components/SavingsChart';
import { CollegeChart } from '@/components/CollegeChart';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from '@/hooks/usePlanCalculations';
import { Plan, IncomePlan, SavingsPlan, CollegePlan } from '@/types/chart';

interface PlanPreviewProps {
  plan: Plan;
}

const PlanPreview = ({ plan }: PlanPreviewProps) => {
  const router = useRouter();
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const planPath = plan.planType === 'income' ? '/income' : plan.planType === 'savings' ? '/savings' : plan.planType === 'rebalance' ? '/tactical-allocation' : '/college';
  
  // Calculate preview data
  const getPreviewData = () => {
    if (plan.planType === 'income') {
      const data = calculateIncomeData(plan as IncomePlan);
      return {
        chart: <IncomeChart chartData={data} isThumbnail={true} />,
        mainValue: formatCurrency(plan.details.income),
        mainLabel: 'Current Income',
        secondaryValue: `${(plan.details.saveRate * 100).toFixed(0)}%`,
        secondaryLabel: 'Savings Rate'
      };
    } else if (plan.planType === 'savings') {
      const { chartData } = calculateSavingsData(plan as SavingsPlan);
      return {
        chart: <SavingsChart chartData={chartData} isThumbnail={true} />,
        mainValue: formatCurrency(plan.details.desiredIncome),
        mainLabel: 'Target Income',
        secondaryValue: plan.details.retirementAge,
        secondaryLabel: 'Retirement Age'
      };
    } else if (plan.planType === 'college') {
      const { chartData, finalTargetAmount, calculatedMonthlyContribution } = calculateCollegeData(plan as CollegePlan);
      const collegeDetails = plan.details as import('@/types/chart').CollegeDetails;
      return {
        chart: <CollegeChart chartData={chartData} isThumbnail={true} />,
        mainValue: formatCurrency(collegeDetails.calculationMode === 'goal' ? finalTargetAmount : calculatedMonthlyContribution),
        mainLabel: collegeDetails.calculationMode === 'goal' ? 'Projected Balance' : 'Required Monthly',
        secondaryValue: collegeDetails.collegeAge,
        secondaryLabel: 'College Age'
      };
    } else {
      // RebalancePlan
      const rebalanceDetails = plan.details as import('@/types/chart').RebalanceDetails;
      return {
        chart: <div className="flex items-center justify-center h-full bg-slate-100 rounded text-slate-400 text-xs">Tactical Model</div>,
        mainValue: formatCurrency(rebalanceDetails.currentCash + rebalanceDetails.currentEquity),
        mainLabel: 'Portfolio Value',
        secondaryValue: `${(rebalanceDetails.targetAnnualReturn * 100).toFixed(1)}%`,
        secondaryLabel: 'Target Return'
      };
    }
  };

  const preview = getPreviewData();

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{plan.planName}</CardTitle>
            <CardDescription className="text-sm">
              Last updated: {formatDate(plan.lastUpdated)}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`${planPath}?plan=${plan.id}`)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-semibold">{preview.mainValue}</p>
              <p className="text-sm text-muted-foreground">{preview.mainLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">{preview.secondaryValue}</p>
              <p className="text-sm text-muted-foreground">{preview.secondaryLabel}</p>
            </div>
          </div>
          <div className="h-[100px] w-full">
            {preview.chart}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanPreview;