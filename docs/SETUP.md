# Setup

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.9 or newer | Tested on Node 24 |
| pnpm | pinned in `package.json` (`packageManager`) | Installed automatically by Corepack |
| Git | any recent | To clone the repository |
| Python 3 | 3.9 or newer | **Only** for rebuilding the data; not needed to run the app |

No database, environment variables or API keys are required.

## 1. Clone

```bash
git clone https://github.com/Vinocoder/TerminatorLab.git
cd TerminatorLab
```

## 2. Install dependencies

```bash
corepack enable
pnpm install
```

`corepack enable` makes the `pnpm` command use the version pinned in `package.json`. If you prefer to use
a pnpm you already have installed, `pnpm install` works with recent versions too.

## 3. Run

```bash
pnpm dev
```

Open <http://localhost:3000>. Pages hot-reload when you edit files.

To use another port: `pnpm dev --port 3001`.

## 4. Check

```bash
pnpm typecheck
```

## 5. Production build (optional)

```bash
pnpm build
pnpm start      # serves the production build on http://localhost:3000
```

## Deploy

The app is a standard Next.js project with no server-side secrets, so it deploys as-is:

- **Vercel:** import the GitHub repository at <https://vercel.com/new>. Defaults are correct
  (framework Next.js, install `pnpm install`, build `pnpm build`).
- **Any Node host:** run `pnpm install && pnpm build && pnpm start`.

## Demo checklist

1. `/` — click the robot's glowing core (or **Cut power**) to show the shutdown.
2. `/case/s1-grok` — the cost-of-waiting curve: harm starts Day 1 03:00, best halt Day 1 05:00.
3. `/play` — click **Start my shift**, use **Pause** / **+6 h** to step, then **Halt world** or quarantine an agent.
4. `/autopsy` — league table, change **alpha** in the dropdown to show the winner changing, and the
   13-world baseline table at the bottom.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `pnpm: command not found` | Run `corepack enable`, or `npm install -g pnpm` |
| `Unsupported engine` / syntax errors on start | Upgrade Node.js to 20.9 or newer (`node -v`) |
| Port 3000 already in use | `pnpm dev --port 3001` |
| Pages show no data | Check that `public/data/tournament.json` and `public/data/worlds/*.json` exist |
| Install warns about ignored build scripts | Safe to ignore; only `esbuild` needs a build step and it is allowed in `pnpm-workspace.yaml` |
