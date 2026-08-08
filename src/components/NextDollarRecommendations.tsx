import { GlobalSettings, Plan } from '@/types/chart';
import { calculateOptimalAllocation } from '@/lib/allocationEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSavingsCalculations, useCollegeCalculations } from '@/hooks/usePlanCalculations';

interface NextDollarRecommendationsProps {
  netCashFlow: number;
  globalSettings: GlobalSettings | null;
  plans: Plan[];
}

export function NextDollarRecommendations({ netCashFlow, globalSettings, plans }: NextDollarRecommendationsProps) {
  const { calculateSavingsData } = useSavingsCalculations();
  const { calculateCollegeData } = useCollegeCalculations();

  const goalDeficits = plans.map(p => {
    if (p.planType === 'savings') {
      const data = calculateSavingsData(p as any, globalSettings, plans);
      return { plan: p, required: data.requiredSavings };
    } else if (p.planType === 'college') {
      const data = calculateCollegeData(p as any, globalSettings, plans);
      return { plan: p, required: data.calculatedMonthlyContribution };
    }
    return null;
  }).filter(Boolean) as { plan: Plan, required: number }[];

  const recommendations = calculateOptimalAllocation(netCashFlow, globalSettings, plans, goalDeficits);

  if (recommendations.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Wealth Strategy (Next Dollar)</CardTitle>
          <CardDescription>No surplus cash flow detected. Focus on reducing core expenses.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-emerald-500">🎯</span> Wealth Strategy
            </CardTitle>
            <CardDescription className="mt-1">
              Optimal deployment for your <strong>${Math.round(netCashFlow / 12).toLocaleString()}</strong> monthly surplus.
            </CardDescription>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right mb-1">Total Surplus</div>
            <div className="text-2xl font-bold text-emerald-600">${Math.round(netCashFlow / 12).toLocaleString()}<span className="text-sm font-normal text-emerald-600/70">/mo</span></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={rec.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border bg-slate-50 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{rec.name}</h4>
                  <p className="text-xs text-slate-500">{rec.reason}</p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-lg font-bold text-slate-700">${Math.round(rec.amount).toLocaleString()}/mo</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score: {rec.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
