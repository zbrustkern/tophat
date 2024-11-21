import dynamic from 'next/dynamic'

const SavingsPlanner = dynamic(
  () => import('@/components/SavingsPlanner'),
  { ssr: false } // Disable server-side rendering
)

export default function SavingsPlannerPage() {
  return <SavingsPlanner />
}