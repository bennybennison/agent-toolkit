---
rule: file-size-caps
scope: universal
profile: standard, full
tags: [maintenance, refactoring, file-size]
---

# File Size Caps

## Limits

| File Type | Max Lines | Action When Exceeded |
|-----------|-----------|---------------------|
| Source files (`.py`, `.ts`, `.tsx`) | 300 | Split by responsibility |
| `AGENTS.md` | 200 | Move detail into adjacent docs or `SKILL.md` |
| `SKILL.md` | 400 | Split by capability area |
| Prompt or instruction files | 400 | Extract stable rules into reusable rule files |
| Test files | 500 | Split by scenario or test class |

## When Not To Split

- The file is tightly coupled and splitting would create circular or confusing dependencies
- The file is a spec, constitution, ADR, or other reference document
- The split would create tiny fragments below about 50 lines each

## How To Split

1. Identify natural split boundaries
2. Map public symbols and importers
3. Create descriptively named files by concern
4. Leave a thin barrel or update imports cleanly
5. Verify tests, imports, and documentation

## Naming Convention For Splits

```text
pricing.py
  -> pricing_eligible.py
  -> pricing_competitive.py
  -> pricing_batch.py
  -> pricing.py   # optional barrel/re-export
```

## Monitoring

Check file size while editing. If a file is approaching the cap, plan the split proactively instead of waiting until navigation degrades badly.
