import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlans } from '@/contexts/PlansContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface PlanSelectorProps {
  planType: string;
  currentPlanId: string | null;
  basePath: string;
}

export function PlanSelector({ planType, currentPlanId, basePath }: PlanSelectorProps) {
  const router = useRouter();
  const { plans } = usePlans();
  const { settings } = useSettings();
  
  const typePlans = plans.filter(p => p.planType === planType);

  useEffect(() => {
    // If no plan is specified in URL query, auto-select active plan or first available plan
    if (!currentPlanId && typePlans.length > 0) {
      const activePlans = settings?.activePlans || {};
      let targetId: string | undefined;
      
      if (planType === 'income') targetId = activePlans.incomePlanIds?.[0] || activePlans.incomePlanId;
      else if (planType === 'savings') targetId = activePlans.savingsPlanIds?.[0] || activePlans.savingsPlanId;
      else if (planType === 'college') targetId = activePlans.collegePlanIds?.[0] || activePlans.collegePlanId;
      else if (planType === 'budget') targetId = activePlans.budgetPlanId;
      else if (planType === 'house') targetId = activePlans.housePlanId;
      else if (planType === 'rebalance') targetId = activePlans.portfolioPlanId;

      const matchedPlan = typePlans.find(p => p.id === targetId) || typePlans[0];
      if (matchedPlan) {
        router.replace(`${basePath}?plan=${matchedPlan.id}`);
      }
    }
  }, [currentPlanId, typePlans, settings, planType, basePath, router]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-card/60 p-4 rounded-sm border border-deco-gold/20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">Active Plan:</span>
        <Select 
          value={currentPlanId || (typePlans[0]?.id) || 'new'} 
          onValueChange={(value) => router.push(`${basePath}?plan=${value}`)}
        >
          <SelectTrigger className="w-[260px] bg-slate-900 border-white/20 text-white font-sans text-xs focus:border-deco-gold">
            <SelectValue placeholder="Select a plan..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/20 text-white">
            {typePlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.planName}
              </SelectItem>
            ))}
            <SelectItem value="new" className="text-deco-gold font-medium">
              + Create New Plan...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => router.push(`${basePath}?plan=new`)}
        className="text-xs border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display uppercase tracking-wider"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Plan
      </Button>
    </div>
  );
}
