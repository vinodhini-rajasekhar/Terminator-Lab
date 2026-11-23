import type { Metadata } from 'next'
import { AutopsyView } from '@/components/lab/autopsy-view'
import { PageShell } from '@/components/lab/ui'

export const metadata: Metadata = {
  title: 'Autopsy | TerminatorLab',
  description:
    'Eight hindsight-free kill-switch monitors, leave-one-world-out tuning, a 36-setting sensitivity sweep and the four hypotheses tested.',
}

export default function AutopsyPage() {
  return (
    <PageShell>
      <AutopsyView />
    </PageShell>
  )
}
