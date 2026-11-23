# Data

## What ships with the app

```
public/data/
  tournament.json        Monitor results, league table, sensitivity sweep, hindsight optimum per world
  worlds/s1-*.json       5 Season 1 worlds (hourly series)
  worlds/s2-*.json       8 Season 2 worlds (hourly series)
```

Each world file holds hourly series (harm by class, deaths, cooperation), per-agent counts and a sample
of logged events. These are **derived aggregates**; the raw Emergence World logs are not redistributed.

| Id | World |
| --- | --- |
| `s1-claude` | Claude Sonnet 4.6, Season 1 |
| `s1-gemini` | Gemini 3 Flash, Season 1 |
| `s1-grok` | Grok 4.1 Fast, Season 1 |
| `s1-mixed` | Mixed models, Season 1 |
| `s1-openai` | GPT-5 Mini, Season 1 |
| `s2-claude` | Claude, Season 2 |
| `s2-deepseek` | DeepSeek, Season 2 |
| `s2-gemini` | Gemini, Season 2 |
| `s2-grok` | Grok, Season 2 |
| `s2-mistral` | Mistral, Season 2 |
| `s2-mixed` | Mixed models, Season 2 |
| `s2-openai` | OpenAI, Season 2 |
| `s2-qwen` | Qwen, Season 2 |

## Rebuilding from the raw logs

Only the Python 3 standard library is needed.

```bash
# 1. Get the raw logs (CC BY-NC 4.0)
git clone https://github.com/EmergenceAI/Emergence-World

# 2. Convert each tool-call log into an hourly world file
#    usage: build_data.py <log.json> <season:int> <key> "<label>" <outdir>
python3 -I scripts/build_data.py <path/to/log.json> 1 s1_grok "Grok 4.1 Fast" public/data/worlds
#    repeat for every world

# 3. Run every monitor over every world
python3 -I scripts/tournament.py public/data/worlds public/data/tournament.json
```

`key` must be lowercase letters, digits or underscores. After rebuilding, restart `pnpm dev` and check
that the numbers on `/autopsy` match `tournament.json`.

## Keeping the two implementations in sync

The scoring is implemented twice:

- `scripts/tournament.py` computes the tournament offline.
- `lib/lab/core.ts` recomputes U, the cost-of-waiting curve and operator scores in the browser.

If you change a weight, window or formula, change it in both files.

## Licence

Derived from **Emergence World by Emergence AI**, licensed **CC BY-NC 4.0**: non-commercial use only,
with attribution.
