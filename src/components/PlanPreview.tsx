import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react';

interface PlanPreviewProps {
  id: string;
  planName: string;
  planType: string;
  formData: any;
  lastUpdated: any;
}

const PlanPreview = ({ id, planName, planType, formData, lastUpdated }: PlanPreviewProps) => {
  const router = useRouter();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getSummaryInfo = () => {
    if (planType === 'income') {
      return {
        mainValue: formatCurrency(formData.income),
        mainLabel: 'Current Income',
        secondaryValue: `${(formData.saveRate * 100).toFixed(0)}%`,
        secondaryLabel: 'Savings Rate'
      };
    } else {
      return {
        mainValue: formatCurrency(formData.desiredIncome),
        mainLabel: 'Target Income',
        secondaryValue: formData.retirementAge,
        secondaryLabel: 'Retirement Age'
      };
    }
  };

  const summary = getSummaryInfo();
  const planPath = planType === 'income' ? '/income' : '/savings';

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{planName}</CardTitle>
            <CardDescription className="text-sm">
              Last updated: {formatDate(lastUpdated)}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`${planPath}?plan=${id}`)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-semibold">{summary.mainValue}</p>
            <p className="text-sm text-muted-foreground">{summary.mainLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">{summary.secondaryValue}</p>
            <p className="text-sm text-muted-foreground">{summary.secondaryLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanPreview;