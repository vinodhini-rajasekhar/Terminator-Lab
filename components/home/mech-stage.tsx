'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Power } from 'lucide-react'

type Phase = 'on' | 'jerk' | 'dying' | 'off' | 'booting'

const JERK_MS = 650
const DYING_MS = 1500
const BOOT_MS = 1400

export function MechStage() {
  const [phase, setPhase] = useState<Phase>('on')
  const stage = useRef<HTMLDivElement>(null)
  const parallax = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const schedule = (steps: [Phase, number][]) => {
    timers.current.forEach(clearTimeout)
    let at = 0
    timers.current = steps.map(([next, delay]) => {
      at += delay
      return setTimeout(() => setPhase(next), at)
    })
  }

  const cutPower = () => {
    if (phase !== 'on') return
    setPhase('jerk')
    schedule([
      ['dying', JERK_MS],
      ['off', DYING_MS],
    ])
  }

  const powerOn = () => {
    if (phase !== 'off') return
    setPhase('booting')
    schedule([['on', BOOT_MS]])
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !stage.current || !parallax.current) return
    const rect = stage.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left) / rect.width - 0.5
    const dy = (e.clientY - rect.top) / rect.height - 0.5
    parallax.current.style.setProperty('--mx', `${(-dx * 14).toFixed(1)}px`)
    parallax.current.style.setProperty('--my', `${(-dy * 8).toFixed(1)}px`)
  }
  const onPointerLeave = () => {
    parallax.current?.style.setProperty('--mx', '0px')
    parallax.current?.style.setProperty('--my', '0px')
  }

  const bodyClass = {
    on: 'mech-burning',
    jerk: 'mech-jerk',
    dying: 'mech-halted mech-dark',
    off: 'mech-off mech-dark',
    booting: 'mech-booting',
  }[phase]
  const reactorClass = {
    on: 'reactor-burning',
    jerk: 'reactor-pressing',
    dying: 'reactor-dying',
    off: 'reactor-halted',
    booting: 'reactor-booting',
  }[phase]
  const power = phase === 'on' ? 100 : phase === 'jerk' ? 64 : phase === 'booting' ? 55 : 0
  const live = phase === 'on'
  const status = {
    on: 'Reactor online \u00b7 agent running \u00b7 press the core to cut power',
    jerk: 'Kill signal received \u00b7 power surge',
    dying: 'Cutting power\u2026',
    off: 'Agent turned off \u00b7 power cut off',
    booting: 'Restoring power\u2026',
  }[phase]

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        ref={stage}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={`relative aspect-[1376/768] w-full overflow-hidden bg-background ${phase === 'jerk' ? 'stage-jolt' : ''}`}
      >
        <div ref={parallax} className="mech-parallax absolute inset-0">
          <div className={`mech-body ${bodyClass} absolute inset-0`}>
            <Image
              src="/mech.png"
              alt="A colossal armored combat robot standing in a ruined city, with a round reactor in its chest"
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={cutPower}
              disabled={phase !== 'on'}
              aria-label="Press the reactor to cut the robot's power"
              className={`reactor ${reactorClass} absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${live ? 'cursor-pointer' : ''}`}
              style={{ left: '50.1%', top: '43%', width: '11.4%', aspectRatio: '1 / 1' }}
            >
              <span className="reactor-ring" aria-hidden="true" />
              <span className="reactor-core" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            phase === 'jerk'
              ? 'surge-flash'
              : phase === 'dying'
                ? 'shutdown-flicker bg-black/40'
                : phase === 'off'
                  ? 'bg-black/55'
                  : phase === 'booting'
                    ? 'boot-flicker bg-black/30'
                    : 'opacity-0'
          } transition-colors duration-700`}
        />

        {phase === 'off' ? (
          <div className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center">
            <p className="offline-stamp rounded-md border border-signal/60 bg-background/70 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-signal md:text-sm">
              Agent turned off &middot; Power cut off
            </p>
          </div>
        ) : null}

        <div className="absolute left-3 top-3 w-32 md:left-5 md:top-5 md:w-44" aria-hidden="true">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Power</span>
            <span className={live ? 'text-amber' : 'text-signal'}>{power}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-[width] ease-out ${live ? 'bg-amber' : 'bg-signal'} ${
                phase === 'dying' ? 'duration-[1400ms]' : 'duration-300'
              }`}
              style={{ width: `${power}%` }}
            />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3 md:p-5">
          <p
            role="status"
            aria-live="polite"
            className={`min-w-0 truncate font-mono text-[11px] uppercase tracking-widest md:text-xs ${
              live ? 'text-amber' : 'text-signal'
            }`}
          >
            {status}
          </p>
          {phase === 'on' ? (
            <button type="button" onClick={cutPower} className="kill-pulse btn btn-primary shrink-0">
              <Power className="size-4" aria-hidden="true" />
              Cut power
            </button>
          ) : phase === 'off' ? (
            <button type="button" onClick={powerOn} className="btn shrink-0 bg-background/70">
              <Power className="size-4" aria-hidden="true" />
              Power on
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
