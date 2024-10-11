import { Suspense } from 'react';
import ClientIncomePlanPage from '@/components/ClientIncomePlanPage';

export default function IncomePlanPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientIncomePlanPage id={params.id} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return [{ id: 'new' }];
}