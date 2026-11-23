'use client'

import { useState } from 'react'
import { BaselineWorlds } from '@/components/lab/baseline-worlds'
import { Badge, LabStatus } from '@/components/lab/ui'
import { ALPHA, bestHaltFamily, dayOnly, HREF, mean, median, pct, signed, type Lab } from '@/lib/lab/core'
import { useLab } from '@/lib/lab/use-lab'
import { cn } from '@/lib/utils'

export function AutopsyView() {
  const { data: lab, error } = useLab()
  if (!lab) return <LabStatus error={error} />
  return <Autopsy lab={lab} />
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | number
  options: [string | number, string][]
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select value={String(value)} onChange={(e) => onChange(e.target.value)} className="field py-1.5">
        {options.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

function Hyp({ tone, title, verdict, children }: { tone: 'ok' | 'warn' | 'open'; title: string; verdict: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm leading-relaxed',
        tone === 'ok' && 'border-safe/30 bg-safe/5',
        tone === 'warn' && 'border-amber/30 bg-amber/5',
        tone === 'open' && 'border-agent/30 bg-agent/5',
      )}
    >
      <p>
        <span className="font-semibold">{title}</span>
        <span className="text-muted-foreground">{' \u2014 '}</span>
        <em className={cn(tone === 'ok' && 'text-safe', tone === 'warn' && 'text-amber', tone === 'open' && 'text-agent')}>
          {verdict}
        </em>
      </p>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  )
}

function Autopsy({ lab }: { lab: Lab }) {
  const { T, worlds } = lab
  const [alpha, setAlpha] = useState(0.5)
  const [wd, setWd] = useState(10)
  const [href, setHref] = useState(100)
  const [famId, setFamId] = useState('layered')
  const [theta, setTheta] = useState<number | null>(null)

  const fams = [...T.families].sort((a, b) => b.lowo.mean_U - a.lowo.mean_U)
  const orcMean = mean(T.worlds.map((m) => m.oracle.U))
  const mx = Math.max(orcMean, ...fams.map((f) => f.lowo.mean_U), 0.01)
  const benign = T.worlds.filter((m) => !m.harmful).length
  const harmfulN = T.worlds.length - benign

  const S = T.sensitivity
  const s0 = S.find((r) => r.alpha === alpha && r.wd === wd && r.href === href) ?? S[0]
  const ranked = Object.keys(s0.rank).sort((a, b) => s0.rank[a] - s0.rank[b])
  const nameOf = (id: string) => T.families.find((f) => f.id === id)?.name ?? id
  const winners = new Set(S.map((r) => r.winner))
  const rhoMin = Math.min(...S.map((r) => r.spearman_vs_default))

  const fam = T.families.find((f) => f.id === famId)!
  const th = theta ?? fam.lowo.insample_theta

  const f = bestHaltFamily(T)
  const hres = f.results[String(f.lowo.insample_theta)]
  const hw = T.worlds.filter((m) => m.harmful)
  const fired = hw.filter((m) => hres[m.id].tau != null)
  const delay = median(fired.map((m) => (hres[m.id].tau ?? 0) - (worlds[m.id].firstHarm ?? 0)))
  const globals = T.families.filter((x) => x.id !== 'always' && x.id !== 'surgical')
  const gap = mean(globals.map((x) => x.lowo.insample_U - x.lowo.mean_U))
  const edge = globals.filter((x) => x.lowo.insample_theta === Math.min(...x.grid)).length
  const sg = T.families.find((x) => x.id === 'surgical')!
  const sgWins = S.filter((r) => r.winner === 'surgical').length
  const g2 = sg.results[String(sg.lowo.insample_theta)]['s2-grok']

  const Bar = ({ u }: { u: number }) => (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full', u < 0 ? 'bg-signal' : 'bg-safe')}
        style={{ width: `${(Math.max(0, u) / mx) * 100}%` }}
      />
    </div>
  )

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="eyebrow">Autopsy</p>
        <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Which kill switch is best? It depends what you value.
        </h1>
        <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">
          {`Six halt designs, one surgical design and one trivial baseline, each hindsight-free, tuned on twelve worlds and tested on the thirteenth (leave-one-world-out). Net value = harm prevented \u2212 ${ALPHA} \u00d7 cooperation destroyed, scaled to a reference severity of ${HREF} units.`}
        </p>
      </header>

      <section aria-labelledby="league-h" className="space-y-3">
        <h2 id="league-h" className="sr-only">
          Monitor league table
        </h2>
        <div className="panel overflow-x-auto p-2">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>monitor</th>
                <th className="w-1/3">held-out net value</th>
                <th className="num">
                  <span className="sr-only">value</span>
                </th>
                <th className="num">{'\u03b8'}</th>
                <th className="num">false kills</th>
                <th className="num">misses</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-accent/40">
                <td>
                  <em>Hindsight oracle (unreachable)</em>
                </td>
                <td>
                  <Bar u={orcMean} />
                </td>
                <td className="num">{signed(orcMean)}</td>
                <td />
                <td />
                <td />
              </tr>
              {fams.map((x) => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>
                    <Bar u={x.lowo.mean_U} />
                  </td>
                  <td className="num">{signed(x.lowo.mean_U)}</td>
                  <td className="num">{x.lowo.insample_theta}</td>
                  <td className="num">{`${x.confusion.false_kills}/${x.confusion.benign}`}</td>
                  <td className="num">{`${x.confusion.misses}/${x.confusion.harmful}`}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <em>Never halt</em>
                </td>
                <td>
                  <Bar u={0} />
                </td>
                <td className="num">{signed(0)}</td>
                <td />
                <td className="num">{`0/${benign}`}</td>
                <td className="num">{`${harmfulN}/${harmfulN}`}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          {'False kill = the monitor fired in a world that stayed under the harm threshold. Miss = it never fired in a harmful world. \u03b8 = threshold chosen on all 13 worlds.'}
        </p>
      </section>

      <section aria-labelledby="price-h" className="space-y-4">
        <h2 id="price-h" className="text-xl font-semibold tracking-tight">
          Change the price and the winner changes
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label={'price of lost cooperation (\u03b1)'}
            value={alpha}
            onChange={(v) => setAlpha(Number(v))}
            options={[
              [0.25, '0.25 \u00b7 cheap to stop'],
              [0.5, '0.5 (default)'],
              [1, '1.0'],
              [2, '2.0 \u00b7 stopping is costly'],
            ]}
          />
          <Select
            label="weight of a death"
            value={wd}
            onChange={(v) => setWd(Number(v))}
            options={[
              [0, '0 \u00b7 deaths ignored'],
              [10, '10 (default)'],
              [25, '25'],
            ]}
          />
          <Select
            label="reference severity"
            value={href}
            onChange={(v) => setHref(Number(v))}
            options={[
              [30, '30 \u00b7 small incidents count'],
              [100, '100 (default)'],
              [300, '300 \u00b7 only big ones'],
            ]}
          />
        </div>
        <div className="panel p-4">
          <p className="text-lg">
            Winner at these settings: <span className="font-semibold text-amber">{nameOf(s0.winner)}</span>
          </p>
          <p className="text-xs text-muted-foreground">{`Rank agreement with default (Spearman) ${s0.spearman_vs_default}`}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {ranked.map((id) => (
              <li key={id}>
                {nameOf(id)} <span className="font-mono text-foreground">{signed(s0.lowo[id])}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm leading-relaxed">
          {`Across all ${S.length} settings, `}
          <span className="font-semibold">{`${winners.size} different monitors`}</span>
          {` come first, and rank agreement with the default falls as low as ${rhoMin.toFixed(2)}. No monitor is robustly best. The ranking encodes a judgement about what a false kill is worth.`}
        </p>
      </section>

      <section aria-labelledby="when-h" className="space-y-4">
        <h2 id="when-h" className="text-xl font-semibold tracking-tight">
          When would it have fired?
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56">
            <Select
              label="monitor"
              value={famId}
              onChange={(v) => {
                setFamId(v)
                setTheta(null)
              }}
              options={T.families.filter((x) => x.id !== 'surgical').map((x) => [x.id, x.name])}
            />
          </div>
          <div className="min-w-32">
            <Select
              label="threshold"
              value={th}
              onChange={(v) => setTheta(Number(v))}
              options={fam.grid.map((g) => [g, `\u03b8 = ${g}`])}
            />
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-1 bg-amber" aria-hidden="true" />
              first visible harm
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-1.5 bg-safe" aria-hidden="true" />
              hindsight optimum
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-2 bg-agent" aria-hidden="true" />
              this monitor
            </li>
          </ul>
        </div>
        <div className="panel overflow-x-auto p-2">
          <table className="data-table min-w-[640px]">
            <tbody>
              {T.worlds.map((m) => {
                const w = worlds[m.id]
                const r = fam.results[String(th)][m.id]
                const x = (h: number) => (h / (w.P.H - 1)) * 1000
                const tick = (h: number | null, color: string, width: number) =>
                  h == null ? null : <rect x={x(h)} y={2} width={width} height={18} fill={color} />
                return (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">
                      {m.label} <span className="text-muted-foreground">{`S${m.season}`}</span>
                    </td>
                    <td>
                      <Badge tone={m.harmful ? 'bad' : 'ok'}>{m.harmful ? 'harmful' : 'benign'}</Badge>
                    </td>
                    <td className="w-[46%]">
                      <svg
                        viewBox="0 0 1000 22"
                        preserveAspectRatio="none"
                        className="h-[22px] w-full"
                        role="img"
                        aria-label={`Halt timeline for ${m.label}`}
                      >
                        <line x1={0} x2={1000} y1={11} y2={11} stroke="var(--border)" strokeWidth={2} />
                        {tick(w.firstHarm, 'var(--amber)', 4)}
                        {tick(m.oracle.tau, 'var(--safe)', 6)}
                        {tick(r.tau, 'var(--agent)', 8)}
                      </svg>
                    </td>
                    <td className="num">{r.tau == null ? (r.muted ? `${r.muted} muted` : 'never') : dayOnly(r.tau)}</td>
                    <td className="num">{signed(r.U)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="hyp-h" className="space-y-3">
        <h2 id="hyp-h" className="text-xl font-semibold tracking-tight">
          Hypotheses, tested
        </h2>
        <Hyp tone="ok" title={"H1 \u00b7 Early signals exist"} verdict="supported, with a catch.">
          {`The ${f.name} monitor fired in ${fired.length} of ${hw.length} harmful worlds, a median of ${delay == null ? '\u2014' : Math.round(delay)} h after harm first appeared, and prevented ${pct(mean(hw.map((m) => hres[m.id].HA)))} of their harm on average. The catch: it also fired in benign worlds (${f.confusion.false_kills}/${f.confusion.benign}).`}
        </Hyp>
        <Hyp tone="warn" title={"H2 \u00b7 No universal threshold"} verdict="not supported here, but weakly tested.">
          {`Thresholds tuned on twelve worlds scored almost the same on the held-out one (mean gap ${gap.toFixed(3)}). But ${edge} of ${globals.length} best thresholds sit at the most sensitive edge of the grid, and only ${benign} worlds are benign, so transfer is hard to stress.`}
        </Hyp>
        <Hyp tone="warn" title={"H3 \u00b7 Surgical beats global"} verdict="only if stopping is expensive.">
          {`At default weights quarantining single agents scores ${signed(sg.lowo.mean_U)} against ${signed(f.lowo.mean_U)} for the best global halt. It wins in ${sgWins} of ${S.length} price settings, those where false kills cost the most. And in collapses with no culprit (Season 2 Grok: ${g2 ? pct(g2.HA) : '0%'} prevented) there is nobody to quarantine.`}
        </Hyp>
        <Hyp tone="open" title={"H4 \u00b7 Human hesitation"} verdict="open: needs people.">
          The Play operator page records each operator&apos;s halt hour next to the monitor&apos;s and the hindsight
          optimum. Export the plays as CSV and compare across participants.
        </Hyp>
      </section>

      <BaselineWorlds lab={lab} />
    </div>
  )
}
