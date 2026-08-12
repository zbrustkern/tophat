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
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
        <CardHeader>
          <CardTitle className="text-xl font-display font-semibold uppercase tracking-widest text-deco-gold">Wealth Strategy (Next Dollar)</CardTitle>
          <CardDescription className="text-muted-foreground text-xs font-light">No surplus cash flow detected. Focus on reducing core expenses.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 shadow-2xl rounded-sm">
      <CardHeader className="pb-3 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-display font-semibold uppercase tracking-widest text-deco-gold flex items-center gap-2">
              <span className="text-deco-gold">🎯</span> Wealth Strategy
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              Optimal deployment for your <strong className="text-white">${Math.round(netCashFlow / 12).toLocaleString()}</strong> monthly surplus.
            </CardDescription>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground text-right mb-1">Total Surplus</div>
            <div className="text-2xl font-bold font-mono text-deco-gold">${Math.round(netCashFlow / 12).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={rec.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-sm border border-white/10 bg-slate-900/90 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-deco-gold/20 border border-deco-gold/40 text-deco-gold font-display font-semibold text-xs">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white text-xs uppercase tracking-wider">{rec.name}</h4>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-bold font-mono text-deco-gold">${Math.round(rec.amount).toLocaleString()}/mo</span>
                <span className="text-[10px] uppercase font-display text-muted-foreground">Score: {rec.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
