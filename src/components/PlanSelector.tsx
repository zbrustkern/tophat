import { useRouter } from 'next/navigation';
import { usePlans } from '@/contexts/PlansContext';
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
  
  const typePlans = plans.filter(p => p.planType === planType);

  // If there are no plans and we are creating a new one, we might not even need the dropdown
  // but it's good to keep it consistent.
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Active Plan:</span>
        <Select 
          value={currentPlanId || 'new'} 
          onValueChange={(value) => router.push(`${basePath}?plan=${value}`)}
        >
          <SelectTrigger className="w-[250px] bg-white">
            <SelectValue placeholder="Select a plan..." />
          </SelectTrigger>
          <SelectContent>
            {typePlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.planName}
              </SelectItem>
            ))}
            <SelectItem value="new" className="text-blue-600 font-medium">
              Create New Plan...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => router.push(`${basePath}?plan=new`)}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Plan
      </Button>
    </div>
  );
}
