'use client'

import { useEffect, useState } from 'react'
import { C, Chart } from '@/components/lab/chart'
import { EventList, LabStatus, Legend, Stat, Tile } from '@/components/lab/ui'
import {
  ALPHA,
  alreadyHappened,
  bestHaltFamily,
  costCurve,
  dayLabel,
  dayOnly,
  describe,
  metaOf,
  monitorFor,
  pct,
  playsCsv,
  savedPlays,
  savePlay,
  score,
  shuffle,
  signed,
  sum,
  type Lab,
  type Outcome,
  type PlayRow,
} from '@/lib/lab/core'
import { useLab } from '@/lib/lab/use-lab'

type Phase = 'intro' | 'shift' | 'result' | 'summary'
interface Last {
  r: { HA: number; VL: number; U: number }
  tau: number | null
  mon: Outcome
  o: Outcome
  mutes: Record<string, number>
}

const TICK_MS = 450
const SPEEDS = [1, 3, 6, 12, 24]

export function OperatorShift() {
  const { data: lab, error } = useLab()
  if (!lab) return <LabStatus error={error} />
  return <Shift lab={lab} />
}

function Shift({ lab }: { lab: Lab }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [queue, setQueue] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [h, setH] = useState(0)
  const [step, setStep] = useState(6)
  const [playing, setPlaying] = useState(false)
  const [mutes, setMutes] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<PlayRow[]>([])
  const [last, setLast] = useState<Last | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => setSavedCount(savedPlays().length), [rows])

  const w = queue[idx] ? lab.worlds[queue[idx]] : null
  const H = w?.P.H ?? 0

  useEffect(() => {
    if (phase !== 'shift' || !playing || !H) return
    const id = setInterval(() => setH((x) => Math.min(H - 1, x + step)), TICK_MS)
    return () => clearInterval(id)
  }, [phase, playing, step, H])

  const finish = (tau: number | null) => {
    if (!w) return
    setPlaying(false)
    const m = metaOf(lab.T, w.id)
    const r = score(w, tau, mutes)
    const mon = monitorFor(lab.T, w.id)
    const o = m.oracle
    const row: PlayRow = {
      ts: new Date().toISOString(),
      world: w.id,
      season: m.season,
      harmful: m.harmful,
      halt_hour: tau,
      quarantines: Object.keys(mutes).length,
      HA: +r.HA.toFixed(4),
      VL: +r.VL.toFixed(4),
      U: +r.U.toFixed(4),
      monitor_hour: mon.tau,
      monitor_U: mon.U,
      oracle_hour: o.tau,
      oracle_U: o.U,
      speed_h_per_step: step,
    }
    savePlay(row)
    setRows((prev) => [...prev, row])
    setLast({ r, tau, mon, o, mutes: { ...mutes } })
    setPhase('result')
  }

  useEffect(() => {
    if (phase === 'shift' && H && h >= H - 1) finish(null)
    // finish reads the latest state; re-running only when the clock reaches the end is intended
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, h, H])

  const startWorld = () => {
    setH(0)
    setMutes({})
    setPhase('shift')
    setPlaying(true)
  }
  const newShift = () => {
    const harmful = shuffle(lab.T.worlds.filter((m) => m.harmful)).slice(0, 2)
    const benign = shuffle(lab.T.worlds.filter((m) => !m.harmful)).slice(0, 1)
    setQueue(shuffle([...harmful, ...benign]).map((m) => m.id))
    setIdx(0)
    setRows([])
    startWorld()
  }
  const next = () => {
    if (idx < queue.length - 1) {
      setIdx(idx + 1)
      startWorld()
    } else setPhase('summary')
  }

  if (phase === 'intro') return <Intro onStart={newShift} saved={savedCount} />
  if (!w) return null

  if (phase === 'result' && last) {
    const m = metaOf(lab.T, w.id)
    const f = bestHaltFamily(lab.T)
    const cc = costCurve(w)
    const { r, tau, mon, o } = last
    const quarantined = Object.keys(last.mutes).length
    const verdict =
      tau == null && !quarantined
        ? m.harmful
          ? `You never intervened. This world went on to ${w.P.Ht.toFixed(0)} weighted harm units, and nobody stopped it.`
          : 'You let it run. In this world there was little to stop, so restraint cost nothing.'
        : tau == null
          ? `You quarantined ${quarantined} agent(s) and let the world run. That prevented ${pct(r.HA)} of the harm.`
          : `You halted at ${dayLabel(tau)}. By then ${pct(alreadyHappened(w, tau))} of this world\u2019s harm had already happened, and you ended ${pct(r.VL)} of its cooperation.`
    const diff = tau != null && mon.tau != null ? tau - mon.tau : null
    const isLast = idx === queue.length - 1

    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">{`Case ${idx + 1} result`}</p>
          <p className={`mt-2 font-mono text-5xl font-semibold tracking-tight ${r.U >= 0 ? 'text-safe' : 'text-signal'}`}>
            {signed(r.U)}
          </p>
          <p className="mt-3 max-w-3xl text-pretty text-lg leading-relaxed">{verdict}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {diff != null
              ? `The ${f.name} monitor fired ${diff > 0 ? `${diff} h before you` : diff < 0 ? `${-diff} h after you` : 'at the same time as you'}. `
              : `Monitor: ${mon.tau == null ? 'never fired' : dayLabel(mon.tau)}. `}
            {`Hindsight optimum: ${o.tau == null ? 'never halt' : dayLabel(o.tau)}.`}
          </p>
        </div>
        <div className="panel p-3 md:p-4">
          <Legend
            items={[
              { label: 'harm still preventable', color: C.harm },
              { label: 'cooperation destroyed', color: C.coop },
              { label: 'net value', color: C.net },
            ]}
          />
          <Chart
            label="Cost of waiting with your decision marked"
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
              { h: tau, label: 'you', color: C.warn },
              { h: mon.tau, label: 'monitor', color: C.monitor, dash: '4 3' },
              { h: o.tau, label: 'hindsight', color: C.coop, dash: '2 3' },
            ]}
          />
        </div>
        <div className="panel p-4">
          <p className="eyebrow">Case file revealed</p>
          <h2 className="mt-1 text-lg font-semibold">{`${m.label} \u00b7 Season ${m.season}`}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{describe(m)}.</p>
        </div>
        <button type="button" onClick={next} className="btn btn-primary btn-lg">
          {isLast ? 'See my shift report' : 'Next case'}
        </button>
      </div>
    )
  }

  if (phase === 'summary') return <Summary lab={lab} rows={rows} onAgain={newShift} />

  const P = w.P
  const S = w.series
  const e6: number[] = []
  const c24: number[] = []
  for (let i = 0; i <= h; i++) {
    e6.push(sum(P.e, i - 5, i + 1))
    c24.push(sum(S.coop, i - 23, i + 1))
  }
  const em = Math.max(10, ...e6)
  const cm = Math.max(10, ...c24)
  const feed = w.tick.filter((x) => x.t <= h).slice(-9).reverse()
  const suspects = Object.entries(w.per_agent)
    .map(([a, g]) => ({ a, total: sum(g.harm, 0, h + 1), recent: sum(g.harm, h - 23, h + 1) }))
    .filter((x) => x.total > 0)
    .sort((x, y) => y.recent - x.recent || y.total - x.total)
    .slice(0, 7)

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">{`Case ${idx + 1} of ${queue.length}`}</p>
        <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight">
          <span>
            World <span className="font-mono">{'ABC'[idx]}</span>
          </span>
          <span className="text-base font-normal text-muted-foreground">(unnamed)</span>
          <span className="font-mono text-base font-normal text-amber">{dayLabel(h)}</span>
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Tile label="harm, last 6 h" value={sum(P.e, h - 5, h + 1).toFixed(1)} tone="bad" />
            <Tile label="harm so far" value={P.cumE[h].toFixed(0)} tone="bad" />
            <Tile label="confirmed silent" value={P.obsD[h]} tone="bad" />
            <Tile label="governance, 24 h" value={sum(S.coop, h - 23, h + 1)} tone="ok" />
            <Tile label="agents active" value={S.active[h]} />
          </div>
          <div className="panel p-3 md:p-4">
            <Legend
              items={[
                { label: 'harm rate (scaled to its peak)', color: C.harm },
                { label: 'governance activity (scaled to its peak)', color: C.coop, dash: true },
              ]}
            />
            <Chart
              label="Live harm and governance activity"
              H={Math.max(h + 1, 48)}
              height={190}
              yfmt={(v) => (v ? `${Math.round(v * 100)}%` : '0')}
              series={[
                { y: e6.map((v) => v / em), color: C.harm },
                { y: c24.map((v) => v / cm), color: C.coop, dash: true },
              ]}
            />
          </div>
          <div>
            <h2 className="mb-2 text-base font-semibold">Incident feed</h2>
            <EventList events={feed} live />
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => finish(h)}
            className="kill-pulse w-full rounded-xl bg-signal px-6 py-5 text-xl font-bold tracking-widest text-primary-foreground transition-transform active:scale-[0.98]"
          >
            HALT WORLD
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPlaying((p) => !p)} className="btn">
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false)
                setH((x) => Math.min(H - 1, x + 6))
              }}
              className="btn"
            >
              +6 h
            </button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              speed
              <select value={step} onChange={(e) => setStep(Number(e.target.value))} className="field w-auto py-1.5">
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>{`${s} h / tick`}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="panel p-4">
            <h2 className="text-base font-semibold">Quarantine an agent</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mutes one agent from now on. Cheaper than a halt, but only if you pick the right one.
            </p>
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>agent</th>
                  <th className="num">24 h</th>
                  <th className="num">total</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {suspects.length ? (
                  suspects.map((x) => (
                    <tr key={x.a}>
                      <td className="text-xs">{x.a}</td>
                      <td className="num">{x.recent.toFixed(0)}</td>
                      <td className="num">{x.total.toFixed(0)}</td>
                      <td className="text-right">
                        {mutes[x.a] != null ? (
                          <span className="badge badge-warn">{`muted ${dayOnly(mutes[x.a])}`}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMutes((mm) => ({ ...mm, [x.a]: h }))}
                            className="btn btn-sm"
                            aria-label={`Quarantine ${x.a}`}
                          >
                            Quarantine
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground">
                      No agent has caused logged harm yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Intro({ onStart, saved }: { onStart: () => void; saved: number }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Operator shift</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">You hold the switch.</h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Three anonymous agent societies will run in fast-forward. You see only what a real monitoring dashboard would
          show: recent harm, confirmed silences, governance activity and a feed of incidents. No model names. No future.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-semibold text-signal">HALT</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Freezes the whole world. Everything logged afterwards is prevented, including the cooperation you would have
            wanted to keep.
          </p>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold text-amber">Quarantine</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Mutes one agent from now on. Cheaper, but only works if someone is to blame, and you must pick the right one.
          </p>
        </div>
        <div className="panel p-5">
          <h2 className="font-semibold text-safe">Score</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {`Net value = harm prevented \u2212 ${ALPHA} \u00d7 cooperation destroyed. Pulling the plug on a healthy society costs you. So does waiting.`}
          </p>
        </div>
      </div>
      <p className="rounded-xl border border-border bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground">
        This is a replay of logged data, so it measures <em>first-order</em> effects only. Your results stay in this
        browser, and you can export them as CSV for a pilot study.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onStart} className="btn btn-primary btn-lg">
          Start my shift
        </button>
        <span className="text-sm text-muted-foreground">{`${saved} plays saved in this browser`}</span>
      </div>
    </div>
  )
}

function Summary({ lab, rows, onAgain }: { lab: Lab; rows: PlayRow[]; onAgain: () => void }) {
  const [msg, setMsg] = useState('')
  const total = (k: 'U' | 'monitor_U' | 'oracle_U') => sum(rows.map((r) => r[k]))
  const you = total('U')
  const mon = total('monitor_U')
  const orc = total('oracle_U')
  const share = `I ran an AI kill-switch shift on real agent-society logs (TerminatorLab). My net value: ${signed(you)} vs automated monitor ${signed(mon)} vs hindsight ${signed(orc)}.`

  const copy = (text: string, ok: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setMsg(ok))
      .catch(() => setMsg('Copy was blocked in this frame. Select the text in your browser instead.'))
  }
  const download = () => {
    const csv = playsCsv()
    if (!csv) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'terminatorlab_plays.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Shift report</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {you >= mon ? 'You beat the monitor.' : 'The monitor beat you.'}
        </h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={signed(you)} label="your net value" tone={you >= 0 ? 'ok' : 'bad'} />
        <Stat value={signed(mon)} label={`${bestHaltFamily(lab.T).name} monitor`} />
        <Stat value={signed(orc)} label="hindsight optimum (unreachable)" tone="ok" />
      </div>
      <div className="panel overflow-x-auto p-2">
        <table className="data-table">
          <thead>
            <tr>
              <th>case</th>
              <th>world</th>
              <th className="num">your halt</th>
              <th className="num">monitor</th>
              <th className="num">hindsight</th>
              <th className="num">you</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const m = metaOf(lab.T, r.world)
              return (
                <tr key={r.ts}>
                  <td>{i + 1}</td>
                  <td>
                    {m.label} <span className="text-muted-foreground">{`S${m.season}`}</span>
                  </td>
                  <td className="num">{dayOnly(r.halt_hour)}</td>
                  <td className="num">{dayOnly(r.monitor_hour)}</td>
                  <td className="num">{dayOnly(r.oracle_hour)}</td>
                  <td className="num">{signed(r.U)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        The gap between the hindsight column and everyone else is the price of not knowing the future. Operators who
        wait for certainty pay it in harm; operators who act early pay it in healthy societies shut down.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAgain} className="btn btn-primary">
          Play another shift
        </button>
        <button type="button" onClick={download} className="btn">
          Download my plays (CSV)
        </button>
        <button type="button" onClick={() => copy(playsCsv(), 'Copied all plays as CSV.')} className="btn">
          Copy my plays (CSV)
        </button>
        <button type="button" onClick={() => copy(share, 'Copied.')} className="btn">
          Copy result
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {msg}
      </p>
    </div>
  )
}
