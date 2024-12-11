"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SavingsPlanner from '@/components/SavingsPlanner';

export default function SavingsPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SavingsPlanner planId={planId} />
    </Suspense>
  );
}