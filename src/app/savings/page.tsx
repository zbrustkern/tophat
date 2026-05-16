"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SavingsPlanner from '@/components/SavingsPlanner';

function SavingsContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const balance = searchParams.get('balance') ? Number(searchParams.get('balance')) : undefined;
  const returnRate = searchParams.get('returnRate') ? Number(searchParams.get('returnRate')) : undefined;
  return <SavingsPlanner planId={planId} initialBalance={balance} initialReturnRate={returnRate} />;
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SavingsContent />
    </Suspense>
  );
}