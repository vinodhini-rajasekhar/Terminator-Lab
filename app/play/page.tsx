import type { Metadata } from 'next'
import { OperatorShift } from '@/components/lab/operator-shift'
import { PageShell } from '@/components/lab/ui'

export const metadata: Metadata = {
  title: 'Play operator | TerminatorLab',
  description:
    'Three anonymous AI-agent societies in fast-forward. Decide when to halt or quarantine, without hindsight, and compare against an automated monitor.',
}

export default function PlayPage() {
  return (
    <PageShell>
      <OperatorShift />
    </PageShell>
  )
}
