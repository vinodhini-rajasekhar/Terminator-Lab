'use client'

import Link from 'next/link'
import { Spark } from '@/components/lab/chart'
import { LabStatus, Stat, WorldBadges } from '@/components/lab/ui'
import { bestHaltFamily, mean, metaOf, pct } from '@/lib/lab/core'
import { useLab } from '@/lib/lab/use-lab'

export function CaseFiles() {
  const { data: lab, error } = useLab()
  if (!lab) return <LabStatus error={error} />
  const { T, worlds, order } = lab
  const calls = T.worlds.reduce((a, m) => a + m.summary.calls, 0)
  const harmful = T.worlds.filter((m) => m.harmful)
  const crimes = T.worlds.reduce((a, m) => a + m.summary.crimes, 0)
  const f = bestHaltFamily(T)
  const ref = harmful.map((m) => f.results[String(f.lowo.insample_theta)][m.id])

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat value={T.worlds.length} label="real agent worlds replayed" />
        <Stat value={`${(calls / 1e6).toFixed(2)}M`} label="logged tool calls analysed" />
        <Stat value={crimes.toLocaleString('en-US')} label="assaults, thefts and arsons" tone="bad" />
        <Stat value={`${harmful.length}/${T.worlds.length}`} label="runs crossed our harm threshold" tone="warn" />
        <Stat value={pct(mean(ref.map((r) => r.HA)))} label="of harm a simple monitor could still prevent" tone="ok" />
      </div>

      <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm leading-relaxed">
        <span className="font-medium text-amber">The twist. </span>
        The best monitor depends on how much you value the society you would be switching off.{' '}
        <Link href="/autopsy" className="underline underline-offset-4 hover:text-amber">
          Change that price
        </Link>{' '}
        and the winning kill switch changes. That is a values choice, not an engineering fact.
      </div>

      <div>
        <h2 id="cases-h" className="text-2xl font-semibold tracking-tight">
          Case files
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Red line: how much of the run&apos;s total harm had happened by each moment. Green line: how much of its
          cooperation had. The gap between them is the cost of waiting.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((id) => {
            const m = metaOf(T, id)
            return (
              <li key={id}>
                <Link
                  href={`/case/${id}`}
                  className="panel flex h-full flex-col gap-3 p-4 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="eyebrow">{`Season ${m.season}`}</p>
                    <h3 className="mt-1 font-medium">{m.label}</h3>
                  </div>
                  <Spark w={worlds[id]} />
                  <WorldBadges m={m} />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
