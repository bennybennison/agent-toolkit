---
name: "terminal-execution"
description: "Safe patterns for running Python and shell commands in the terminal."
pack: "skills-core"
---

# Skill: Terminal Execution

Safe patterns for running Python and shell commands in the terminal.

**Principle:** Prefer terminal commands over temp script files. Script files leave clutter.

---

## Decision Tree

```
Need to run something?
  |
  +-- Simple shell command (ls, grep, wc)?
  |     -> Run directly
  |
  +-- Python one-liner (< 3 statements)?
  |     -> python3 -c 'code here'
  |
  +-- Python multi-line (< 20 lines)?
  |     -> python3 -c '\n...\n' with real newlines
  |     -> NO non-ASCII in comments
  |
  +-- Content has single quotes?
  |     -> Use """triple quotes""" inside
  |
  +-- Writing a file with special chars?
  |     -> python3 -c with Path.write_text()
  |     -> NEVER cat heredoc
  |
  +-- Complex logic (> 20 lines, project imports)?
        -> Create script file, run with uv run python
        -> Delete after if one-off
```

## Safe Patterns

### Shell Commands
```bash
ls -la src/
grep -r "pattern" src/ --include="*.py"
wc -l src/domain/AGENTS.md
```

### Python One-Liner
```bash
# Single outer quotes, double inner
python3 -c 'print("hello")'
python3 -c 'import json; print(json.dumps({"key": "value"}))'
```

### Python Multi-Line
```bash
python3 -c '
import pathlib
p = pathlib.Path("src")
for item in sorted(p.iterdir()):
    print(item.name)
'
```

### Writing Files
```bash
python3 -c '
from pathlib import Path
content = """# Title

Content with special chars here.
"""
Path("output.md").write_text(content)
'
```

## Dangerous Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `cat > file << 'EOF'` with unicode | Encoding corruption | `python3 -c` with `Path.write_text()` |
| `cat > file << EOF` (unquoted) | Variable expansion corrupts content | Always quote: `<< 'EOF'` |
| Non-ASCII in `python3 -c` comments | Command garbles entirely | ASCII-only comments |
| `python -c` (no `3`) | May not exist on macOS | `python3` or `uv run python` |
| Double outer quotes | Quote nesting breaks | Single outer quotes |
| `echo -e` for multiline | Inconsistent across shells | `python3 -c` with `Path.write_text()` |
| `sed -i` with special chars | Delimiter collisions, portability | `python3 -c` with file read/write |
| Piping untrusted input to `eval` | Code injection | Never use `eval` with external input |

### The Em-Dash Trap

Non-ASCII in **comments** inside `python3 -c` corrupts the entire command:

```bash
# BREAKS -- em-dash in comment kills it
python3 -c '
# Fix files -- cross-references    <-- THIS KILLS IT
'

# WORKS -- plain ASCII in comments
python3 -c '
# Fix files - cross-references
'
```

Unicode is fine in Python **string values** but NOT in comments or variable names inside `-c` blocks.

## When to Create a Script File

Only when:
- Logic exceeds ~20 lines
- You need `try/except` error handling
- You need project imports (`uv run`)
- The script will be reused

If one-off, delete it after: `uv run python scripts/check.py && rm scripts/check.py`

---

## Heredoc Limitations

Heredocs (`<< 'EOF'`) are tempting for multi-line file creation but have real problems:

| Issue | Details |
|-------|---------|
| Unicode corruption | Non-ASCII characters may corrupt depending on terminal encoding |
| Variable expansion | Unquoted `<< EOF` expands `$variables` — use `<< 'EOF'` to prevent |
| Indentation | `<<-EOF` only strips tabs, not spaces — easy to get wrong |
| Special characters | Backticks, `$()`, and `!` require careful escaping |
| Portability | Behavior varies between bash, zsh, and sh |

**Rule of thumb:** If the content has any special characters, Unicode, or is longer than 5 lines, use `python3 -c` with `Path.write_text()` instead.

---

## Quick Reference

| Task | Command |
|------|---------|
| Quick check | `python3 -c 'print(...)'` |
| File creation | `python3 -c 'from pathlib import Path; Path("f").write_text("...")'` |
| Multi-line logic | `python3 -c '` with real newlines, single outer quotes |
| Project script | `uv run python scripts/thing.py` |
| Shell one-liner | Run directly |
| Complex logic (>20 lines) | Create a `.py` file |

---

## See Also

- [cli-conventions](../cli-conventions/SKILL.md) — CLI tool design patterns
- [logging-standards](../logging-standards/SKILL.md) — Output and logging conventions
