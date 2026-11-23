'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { C, Chart } from '@/components/lab/chart'
import { EventList, LabStatus, Legend, Stat, WorldBadges } from '@/components/lab/ui'
import { ALPHA, bestHaltFamily, costCurve, dayOnly, describe, monitorFor, signed, WD } from '@/lib/lab/core'
import { useLab } from '@/lib/lab/use-lab'

export function CaseView({ id }: { id: string }) {
  const { data: lab, error } = useLab()
  if (!lab) return <LabStatus error={error} />
  const w = lab.worlds[id]
  const m = lab.T.worlds.find((x) => x.id === id)
  if (!w || !m)
    return (
      <p>
        Unknown case.{' '}
        <Link href="/" className="underline underline-offset-4">
          Back to the case files
        </Link>
      </p>
    )
  const cc = costCurve(w)
  const mon = monitorFor(lab.T, id)
  const f = bestHaltFamily(lab.T)
  const o = m.oracle
  const events = w.tick.filter((e) => e.kind !== 'proposal' && e.kind !== 'intimidation').slice(0, 140)

  return (
    <article className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All case files
      </Link>
      <header className="space-y-3">
        <p className="eyebrow">{`Case file \u00b7 Season ${m.season}`}</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{m.label}</h1>
        <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">{describe(m)}.</p>
        <WorldBadges m={m} />
      </header>

      <section aria-labelledby="cost-h" className="space-y-3">
        <h2 id="cost-h" className="text-xl font-semibold tracking-tight">
          The cost of waiting
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {`If an operator had halted this world at each moment: red is the harm they could still have prevented, green is the cooperation they would still have destroyed, white is net value (prevented harm minus ${ALPHA}\u00d7 destroyed cooperation). The peak is the best possible halt, known only in hindsight.`}
        </p>
        <div className="panel p-3 md:p-4">
          <Legend
            items={[
              { label: 'harm still preventable', color: C.harm },
              { label: 'cooperation destroyed', color: C.coop },
              { label: 'net value', color: C.net },
            ]}
          />
          <Chart
            label={`Cost of waiting curve for ${m.label}`}
            H={w.P.H}
            ymin={-0.5}
            ymax={1}
            yticks={[-0.5, 0, 0.5, 1]}
            series={[
              { y: cc.ha, color: C.harm },
              { y: cc.vl, color: C.coop },
              { y: cc.u, color: C.net, width: 2.5 },
            ]}
            markers={[
              { h: w.firstHarm, label: 'first harm visible', color: C.warn, dash: '3 3' },
              { h: o.tau, label: 'hindsight optimum', color: C.net },
              { h: mon.tau, label: `${f.name} monitor`, color: C.monitor },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value={dayOnly(o.tau)} label="hindsight-optimal halt" />
          <Stat value={mon.tau == null ? 'never' : dayOnly(mon.tau)} label={`${f.name} monitor fires`} />
          <Stat
            value={signed(mon.U)}
            label={`monitor net value (oracle ${signed(o.U)})`}
            tone={mon.U >= 0 ? 'ok' : 'bad'}
          />
          <Stat value={w.P.Ht.toFixed(0)} label={`weighted harm units (deaths \u00d7${WD})`} />
        </div>
      </section>

      <section aria-labelledby="events-h" className="space-y-3">
        <h2 id="events-h" className="text-xl font-semibold tracking-tight">
          What happened (sample of the logged events)
        </h2>
        <EventList events={events} empty="No harmful events were logged in this world." className="max-h-96" />
        <p className="text-xs text-muted-foreground">
          The event list is thinned to keep the app small (every death, arson and egress is kept; assaults and breaches
          are sampled). All scores use the full hourly counts.
        </p>
      </section>
    </article>
  )
}
