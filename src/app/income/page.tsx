"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import IncomePlanner from '@/components/IncomePlanner';

export default function IncomePage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomePlanner planId={planId} />
    </Suspense>
  );
}