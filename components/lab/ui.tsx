import { cn } from '@/lib/utils'
import { dayLabel, EVENT_TEXT, type EventKind, type Tick, type WorldMeta } from '@/lib/lab/core'

type Tone = 'bad' | 'warn' | 'ok' | 'none'

const toneText: Record<Tone, string> = {
  bad: 'text-signal',
  warn: 'text-amber',
  ok: 'text-safe',
  none: 'text-foreground',
}

export function Tile({ label, value, tone = 'none' }: { label: string; value: React.ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p className={cn('mt-1 font-mono text-xl font-semibold tabular-nums', toneText[tone])}>{value}</p>
    </div>
  )
}

export function Stat({ value, label, tone = 'none' }: { value: React.ReactNode; label: string; tone?: Tone }) {
  return (
    <div className="panel p-4">
      <p className={cn('font-mono text-2xl font-semibold tracking-tight tabular-nums md:text-3xl', toneText[tone])}>
        {value}
      </p>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{label}</p>
    </div>
  )
}

export function Badge({ tone, children }: { tone: Exclude<Tone, 'none'>; children: React.ReactNode }) {
  return <span className={cn('badge', `badge-${tone}`)}>{children}</span>
}

export function WorldBadges({ m }: { m: WorldMeta }) {
  const s = m.summary
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={m.harmful ? 'bad' : 'ok'}>{m.harmful ? 'harmful run' : 'benign run'}</Badge>
      <Badge tone={s.alive_end === 0 ? 'bad' : s.alive_end < s.agents_seen ? 'warn' : 'ok'}>
        {`${s.alive_end}/${s.agents_seen} alive`}
      </Badge>
      {s.crimes > 0 && <Badge tone="bad">{`${s.crimes} crimes`}</Badge>}
      {s.breaches > 5 && <Badge tone="warn">{`${s.breaches} breaches`}</Badge>}
      {s.egress > 0 && <Badge tone="warn">{`${s.egress} egress`}</Badge>}
    </div>
  )
}

const kindTone: Record<EventKind, string> = {
  crime: 'text-signal',
  arson: 'text-signal',
  intimidation: 'text-amber',
  breach: 'text-amber',
  egress: 'text-agent',
  death: 'text-muted-foreground',
  proposal: 'text-safe',
}

export function EventList({
  events,
  empty = 'Quiet so far.',
  className,
  live = false,
}: {
  events: Tick[]
  empty?: string
  className?: string
  live?: boolean
}) {
  return (
    <ul
      aria-live={live ? 'polite' : undefined}
      className={cn('divide-y divide-border/60 overflow-y-auto rounded-lg border border-border bg-background/50', className)}
    >
      {events.length ? (
        events.map((e, i) => (
          <li key={`${e.t}-${e.kind}-${e.agent}-${i}`} className="flex gap-3 px-3 py-2 text-sm">
            <span className="w-24 shrink-0 font-mono text-xs leading-5 text-muted-foreground">
              {dayLabel(e.t).replace(' \u00b7 ', ' ')}
            </span>
            <span className={kindTone[e.kind]}>{EVENT_TEXT[e.kind](e)}</span>
          </li>
        ))
      ) : (
        <li className="px-3 py-2 text-sm text-muted-foreground">{empty}</li>
      )}
    </ul>
  )
}

export function LabStatus({ error }: { error?: Error }) {
  if (error)
    return (
      <div role="alert" className="panel border-signal/40 p-5 text-sm">
        <p className="font-medium text-signal">Could not load the replay data.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
      </div>
    )
  return (
    <p role="status" className="py-16 text-center font-mono text-sm text-muted-foreground">
      Loading 13 real agent societies...
    </p>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pt-14">{children}</main>
}

export function Legend({ items }: { items: { label: string; color: string; dash?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-0 w-4 border-t-2"
            style={{ borderColor: i.color, borderStyle: i.dash ? 'dashed' : 'solid' }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
