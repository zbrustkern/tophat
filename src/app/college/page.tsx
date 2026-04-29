"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CollegePlanner from '@/components/CollegePlanner';

function CollegeContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  return <CollegePlanner planId={planId} />;
}

export default function CollegePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollegeContent />
    </Suspense>
  );
}