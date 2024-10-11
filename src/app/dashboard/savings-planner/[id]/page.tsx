import { Suspense } from 'react';
import ClientSavingsPlanPage from '@/components/ClientSavingsPlanPage';

export default function SavingsPlanPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientSavingsPlanPage id={params.id} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return [{ id: 'new' }];
}