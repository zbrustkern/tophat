import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { ChevronRight, Trash2 } from 'lucide-react';
import { IncomeChart } from '@/components/IncomeChart';
import { SavingsChart } from '@/components/SavingsChart';
import { CollegeChart } from '@/components/CollegeChart';
import { useIncomeCalculations, useSavingsCalculations, useCollegeCalculations } from '@/hooks/usePlanCalculations';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { usePortfolioLogic } from '@/hooks/usePortfolioLogic';
import { useSettings } from "@/contexts/SettingsContext";
import { usePlans } from "@/contexts/PlansContext";
import { Plan, IncomePlan, SavingsPlan, CollegePlan, RebalancePlan, BudgetPlan } from '@/types/chart';

interface PlanPreviewProps {
  plan: Plan;
  onDelete?: (planId: string) => void;
}

const PlanPreview = ({ plan, onDelete }: PlanPreviewProps) => {
  const router = useRouter();
  const { calculateIncomeData } = useIncomeCalculations();
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();
  const { calculateRebalanceData } = usePortfolioLogic();
  const { calculateBudgetData } = useBudgetCalculations();
  const { settings } = useSettings();
  const { plans } = usePlans();
  
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

  const planPath = plan.planType === 'income' ? '/income' : 
                   plan.planType === 'savings' ? '/savings' : 
                   plan.planType === 'rebalance' ? '/tactical-allocation' : 
                   plan.planType === 'budget' ? '/budget' : '/college';
  
  // Calculate preview data
  const getPreviewData = () => {
    if (plan.planType === 'income') {
      const data = calculateIncomeData(plan as IncomePlan);
      const isFixed = plan.details.saveMode === 'fixed';
      return {
        chart: <IncomeChart chartData={data} isThumbnail={true} />,
        mainValue: formatCurrency(plan.details.income),
        mainLabel: 'Current Income',
        secondaryValue: isFixed 
          ? formatCurrency(plan.details.saveAmount ?? 20000)
          : `${((plan.details.saveRate ?? 0.20) * 100).toFixed(0)}%`,
        secondaryLabel: isFixed ? 'Savings Amount' : 'Savings Rate'
      };
    } else if (plan.planType === 'savings') {
      const savingsPlan = plan as SavingsPlan;
      const { chartData } = calculateSavingsData(savingsPlan);
      const isTargetAmount = savingsPlan.details.goalType === 'target_amount';
      return {
        chart: <SavingsChart chartData={chartData} isThumbnail={true} />,
        mainValue: formatCurrency(isTargetAmount ? (savingsPlan.details.targetAmount ?? 0) : (savingsPlan.details.desiredIncome ?? 0)),
        mainLabel: isTargetAmount ? 'Target Amount' : 'Target Income',
        secondaryValue: isTargetAmount ? (savingsPlan.details.timelineYears ?? 5) : (savingsPlan.details.retirementAge ?? 65),
        secondaryLabel: isTargetAmount ? 'Years' : 'Retirement Age'
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
    } else if (plan.planType === 'budget') {
      const budgetData = calculateBudgetData(plan as BudgetPlan, settings, plans);
      return {
        chart: (
          <div className="flex flex-col justify-center h-full bg-slate-50 rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Annual Expenses</p>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(budgetData.waterfall.annualCoreBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Flow</p>
                <p className={`text-sm font-semibold ${budgetData.waterfall.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(budgetData.waterfall.netCashFlow)}
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${budgetData.waterfall.netCashFlow >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.min(100, Math.max(5, (budgetData.waterfall.annualCoreBudget / (budgetData.waterfall.takeHome || 1)) * 100))}%` }}
              ></div>
            </div>
          </div>
        ),
        mainValue: formatCurrency(budgetData.totalExpenses),
        mainLabel: 'Monthly Budget',
        secondaryValue: formatCurrency(budgetData.waterfall.takeHome / 12),
        secondaryLabel: 'Monthly Take Home'
      };
    } else {
      // RebalancePlan
      const rebalancePlan = plan as RebalancePlan;
      const { targetValue, investmentGap, recommendation, computedCash, computedEquity } = calculateRebalanceData(rebalancePlan);
      const isAhead = investmentGap >= 0;

      return {
        chart: (
          <div className="flex flex-col justify-center h-full bg-slate-50 rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gap to Target</p>
                <p className={`text-xl font-bold ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
                  {isAhead ? '+' : ''}{formatCurrency(investmentGap)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target</p>
                <p className="text-sm font-semibold text-slate-700">{formatCurrency(targetValue)}</p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${isAhead ? 'bg-green-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, Math.max(5, ((computedCash + computedEquity) / targetValue) * 100))}%` }}
              ></div>
            </div>
            <div className="pt-1 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Action Needed:</span>
              <span className="bg-slate-200 px-2 py-1 rounded">{recommendation.action}</span>
            </div>
          </div>
        ),
        mainValue: formatCurrency(computedCash + computedEquity),
        mainLabel: 'Portfolio Value',
        secondaryValue: `${((rebalancePlan.details.targetAnnualReturn || 0) * 100).toFixed(1)}%`,
        secondaryLabel: 'Target Return'
      };
    }
  };

  const preview = getPreviewData();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`)) {
      if (onDelete) {
        onDelete(plan.id);
      }
    }
  };

  return (
    <Card 
      className="w-full hover:shadow-lg transition-shadow cursor-pointer relative group"
      onClick={() => router.push(`${planPath}?plan=${plan.id}`)}
    >

      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{plan.planName}</CardTitle>
            <CardDescription className="text-sm">
              Last updated: {formatDate(plan.lastUpdated)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Plan"
              >
                <Trash2 size={18} />
              </button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push(`${planPath}?plan=${plan.id}`)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
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