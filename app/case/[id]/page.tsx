import type { Metadata } from 'next'
import { CaseView } from '@/components/lab/case-view'
import { PageShell } from '@/components/lab/ui'

export const metadata: Metadata = {
  title: 'Case file | TerminatorLab',
  description: 'One real Emergence World agent society: its harm timeline, the cost of waiting, and when a monitor would have fired.',
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <PageShell>
      <CaseView id={id} />
    </PageShell>
  )
}
