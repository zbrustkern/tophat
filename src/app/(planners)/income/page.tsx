import dynamic from 'next/dynamic'

const IncomePlanner = dynamic(
  () => import('@/components/IncomePlanner'),
  { ssr: false } // Disable server-side rendering
)

export default function IncomePlannerPage() {
  return <IncomePlanner />
}