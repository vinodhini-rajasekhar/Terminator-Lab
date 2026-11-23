import type { Metadata } from 'next'
import { MethodView } from '@/components/lab/method-view'
import { PageShell } from '@/components/lab/ui'

export const metadata: Metadata = {
  title: 'Method and limits | TerminatorLab',
  description:
    'Research question, data pipeline, validation against published Emergence World figures, limitations, misuse and ethics.',
}

export default function MethodPage() {
  return (
    <PageShell>
      <MethodView />
    </PageShell>
  )
}
