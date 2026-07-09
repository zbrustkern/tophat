"use client"

import { Suspense } from 'react';
import BudgetPlanner from '@/components/BudgetPlanner';
import { usePlanNavigation } from '@/hooks/usePlanNavigation';

function BudgetContent() {
  const { planId, isReady } = usePlanNavigation('budget', '/budget');
  
  if (!isReady) return <div>Loading...</div>;
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <BudgetPlanner planId={planId} />
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BudgetContent />
    </Suspense>
  );
}
