# CLAUDE.md

TerminatorLab is a Next.js 16 (App Router, Tailwind v4, pnpm) Responsible AI project that replays 13 real
agent societies from the Emergence World logs and evaluates AI kill switches.

## Commands
- `pnpm dev` start at http://localhost:3000
- `pnpm typecheck` TypeScript check
- `python3 scripts/build_data.py` / `scripts/tournament.py` regenerate `public/data` from raw logs (optional)

## Structure
- `app/` routes: `/`, `/case/[id]`, `/play`, `/autopsy`, `/method`
- `lib/lab/core.ts` all scoring math (keep in sync with `scripts/tournament.py`)
- `lib/lab/use-lab.ts` SWR loader for `public/data/tournament.json` and `public/data/worlds/*.json`
- `components/home/mech-stage.tsx` robot hero; pressing the core cuts power on a replayed world
- `components/lab/` chart, case files, case view, operator game, autopsy, method

## Rules
- Data is real logged behaviour; never invent numbers. Counterfactuals are first-order only.
- Do not rank model vendors; each world is a single run.
- Data licence CC BY-NC 4.0, attribute Emergence AI.
- Design tokens live in `app/globals.css` (signal red, amber, safe green, agent blue on dark).
