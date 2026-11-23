import { WD, type World } from '@/lib/lab/core'

export const C = {
  harm: 'var(--signal)',
  coop: 'var(--safe)',
  net: 'var(--foreground)',
  warn: 'var(--amber)',
  monitor: 'var(--agent)',
}

interface Line {
  y: number[]
  color: string
  width?: number
  dash?: boolean
}
interface Marker {
  h: number | null | undefined
  label: string
  color: string
  dash?: string
}

export function Chart({
  label,
  H,
  series,
  markers = [],
  ymin = 0,
  ymax = 1,
  height = 230,
  yticks = [0, 0.5, 1],
  yfmt = (v: number) => v.toFixed(1),
}: {
  label: string
  H: number
  series: Line[]
  markers?: Marker[]
  ymin?: number
  ymax?: number
  height?: number
  yticks?: number[]
  yfmt?: (v: number) => string
}) {
  const W = 760
  const pl = 40
  const pr = 10
  const pt = 14
  const pb = 26
  const X = (h: number) => pl + ((W - pl - pr) * h) / Math.max(H - 1, 1)
  const Y = (v: number) => pt + (height - pt - pb) * (1 - (v - ymin) / (ymax - ymin))
  const step = H > 240 ? 48 : 24
  const days: number[] = []
  for (let h = 0; h < H; h += step) days.push(h)

  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={label} className="h-auto w-full font-mono text-[11px]">
      {yticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} stroke="var(--border)" />
          <text x={4} y={Y(t) + 4} className="fill-muted-foreground">
            {yfmt(t)}
          </text>
        </g>
      ))}
      {days.map((h) => (
        <text key={h} x={X(h)} y={height - 8} textAnchor="middle" className="fill-muted-foreground">
          {`d${h / 24 + 1}`}
        </text>
      ))}
      {series.map((s, i) => (
        <path
          key={i}
          d={s.y
            .map((v, h) => `${h ? 'L' : 'M'}${X(h).toFixed(1)},${Y(Math.max(ymin, Math.min(ymax, v))).toFixed(1)}`)
            .join('')}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width ?? 2}
          strokeDasharray={s.dash ? '5 4' : undefined}
        />
      ))}
      {markers.map((m, i) => {
        if (m.h == null) return null
        const right = X(m.h) > W - 150
        return (
          <g key={m.label}>
            <line
              x1={X(m.h)}
              x2={X(m.h)}
              y1={pt}
              y2={height - pb}
              stroke={m.color}
              strokeWidth={1.5}
              strokeDasharray={m.dash}
            />
            <text
              x={X(m.h) + (right ? -5 : 5)}
              y={pt + 11 + (i % 3) * 13}
              textAnchor={right ? 'end' : 'start'}
              style={{ fill: m.color }}
            >
              {m.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Red: share of total harm so far. Green: share of total cooperation so far. */
export function Spark({ w }: { w: World }) {
  const P = w.P
  const H = P.H
  const Hc = P.cumE.map((v, h) => v + WD * P.cumD[h])
  const pts = (arr: number[], tot: number) =>
    arr.map((v, h) => `${((h / (H - 1)) * 240).toFixed(1)},${(60 - (tot ? v / tot : 0) * 56).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true" className="h-16 w-full">
      <polyline fill="none" stroke={C.coop} strokeWidth={1.6} points={pts(P.cumC, P.Ct)} />
      <polyline fill="none" stroke={C.harm} strokeWidth={2} points={pts(Hc, Hc[H - 1])} />
    </svg>
  )
}
