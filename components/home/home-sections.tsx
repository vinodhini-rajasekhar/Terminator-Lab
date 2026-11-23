import Link from 'next/link'
import { ArrowRight, FlaskConical, Power } from 'lucide-react'
import { MechStage } from '@/components/home/mech-stage'
import { CaseFiles } from '@/components/lab/case-files'

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 md:pt-20">
      <p className="eyebrow mb-4">{'Responsible AI \u00b7 agent oversight'}</p>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
        Would you have pulled the plug?
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
        In 2026, Emergence AI left frontier-model agents alone in persistent towns. Some societies built libraries and
        passed laws. Others stole, burned buildings, read each other&apos;s private memories, or simply died out. They
        published the logs. We turned them into <span className="font-medium text-foreground">13 case files</span> and
        one question: <em>when does a kill switch have to fire, and what does firing cost?</em>
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/play" className="btn btn-primary btn-lg">
          <Power className="size-4" aria-hidden="true" />
          Play operator (3 min)
        </Link>
        <Link href="/autopsy" className="btn btn-lg">
          Open the autopsy
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/method" className="btn btn-lg">
          <FlaskConical className="size-4" aria-hidden="true" />
          {'Method & limits'}
        </Link>
      </div>
      <div className="mt-10">
        <MechStage />
      </div>
    </section>
  )
}

export function HomeCaseFiles() {
  return (
    <section aria-labelledby="cases-h" className="mx-auto max-w-6xl px-4 pb-20">
      <CaseFiles />
    </section>
  )
}
