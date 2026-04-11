# Friction Log

> Log friction events as they happen. Review periodically to identify systemic issues.

## Format

```text
### YYYY-MM-DD | {trigger} | {severity: low|medium|high}

Context: what you were doing
Friction: what went wrong or was harder than expected
Resolution: how you worked around it
Prevention: what would prevent it in future
```

## Triggers

| Trigger | When To Log |
|---------|-------------|
| `terminal-error` | Command exits non-zero |
| `file-search` | 3+ reads to find the target |
| `retry` | 2+ attempts at the same operation |
| `schema-error` | SQL or data shape mismatch |
| `debug-script` | Temporary script created and discarded |
| `workaround` | Indirect workaround used |

## Do Not Log

- user requirement changes
- intentional exploration
- immediate typo fixes
- purely external service failures

## Entries

_(Add entries below, newest first.)_
