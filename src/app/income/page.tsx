"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import IncomePlanner from '@/components/IncomePlanner';

function IncomeContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const balance = searchParams.get('balance') ? Number(searchParams.get('balance')) : undefined;
  const returnRate = searchParams.get('returnRate') ? Number(searchParams.get('returnRate')) : undefined;
  return <IncomePlanner planId={planId} initialBalance={balance} initialReturnRate={returnRate} />;
}

export default function IncomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomeContent />
    </Suspense>
  );
}