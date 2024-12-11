"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import IncomePlanner from '@/components/IncomePlanner';

function IncomeContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  return <IncomePlanner planId={planId} />;
}

export default function IncomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomeContent />
    </Suspense>
  );
}