"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SavingsPlanner from '@/components/SavingsPlanner';

function SavingsContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  return <SavingsPlanner planId={planId} />;
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SavingsContent />
    </Suspense>
  );
}