'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Power } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Case files' },
  { href: '/play', label: 'Play operator' },
  { href: '/autopsy', label: 'Autopsy' },
  { href: '/method', label: 'Method' },
]

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-signal text-primary-foreground">
            <Power className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">TerminatorLab</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' || pathname.startsWith('/case') : pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
                  active && 'bg-accent text-foreground',
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
