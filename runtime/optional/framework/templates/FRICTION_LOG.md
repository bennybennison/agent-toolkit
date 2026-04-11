# Friction Log

> Log friction events as they happen. Review periodically to identify systemic issues.

## Format

```
### YYYY-MM-DD | {trigger} | {severity: low/medium/high}

**Context:** What you were doing
**Friction:** What went wrong or was harder than expected
**Resolution:** How you worked around it
**Prevention:** What would prevent this in the future (or "none - one-off")
```

## Triggers

| Trigger | When to Log |
|---------|-------------|
| `terminal-error` | Command exits with non-zero code |
| `file-search` | 3+ file reads to find what you need |
| `retry` | 2+ attempts at same operation |
| `schema-error` | SQL/data error (unknown column, wrong type) |
| `debug-script` | Created temp script then deleted |
| `workaround` | Used indirect approach due to friction |

## Do NOT Log

- User requirement changes
- Intentional exploration
- Immediate typo fixes
- External API failures (not our fault)

---

## Entries

_(Add entries below, newest first)_
