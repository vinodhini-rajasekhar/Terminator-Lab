'use client'

import useSWR from 'swr'
import { prepare, type Lab, type RawWorld, type Tournament } from '@/lib/lab/core'

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return res.json() as Promise<T>
}

async function loadLab(): Promise<Lab> {
  const T = await getJson<Tournament>('/data/tournament.json')
  const order = T.worlds.map((m) => m.id)
  const raws = await Promise.all(order.map((id) => getJson<RawWorld>(`/data/worlds/${id}.json`)))
  const worlds: Lab['worlds'] = {}
  raws.forEach((raw, i) => {
    worlds[order[i]] = prepare({ ...raw, id: order[i] })
  })
  return { T, worlds, order }
}

/** All 13 replayed worlds plus the tournament results, loaded once and shared across pages. */
export function useLab() {
  return useSWR('terminatorlab-data', loadLab, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  })
}
