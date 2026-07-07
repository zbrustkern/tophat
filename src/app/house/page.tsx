import HousePlanner from '@/components/HousePlanner';

export default function HousePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const planId = typeof searchParams.plan === 'string' ? searchParams.plan : null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <HousePlanner planId={planId} />
    </div>
  );
}
