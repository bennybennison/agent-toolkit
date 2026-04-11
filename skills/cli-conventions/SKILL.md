---
name: "cli-conventions"
description: "Standardizes how command-line tools are structured with `argparse`. Following"
pack: "skills-python"
---

# Skill: CLI Conventions for Python (argparse)

Standardizes how command-line tools are structured with `argparse`. Following
these conventions keeps flags predictable across tools so users (and agents)
do not have to re-learn each one.

## When to Use

- Building a new CLI tool with `argparse`.
- Adding subcommands or flags to an existing tool.
- Reviewing a CLI for consistency before release.

## Reserved Short Flags

Never redefine these. Users and scripts depend on their meaning being stable.

| Flag | Long Form | Purpose |
|------|-----------|---------|
| `-h` | `--help` | Show help (argparse built-in) |
| `-v` | `--verbose` | Increase output verbosity |
| `-q` | `--quiet` | Suppress non-essential output |
| `-d` | `--dry-run` | Preview without executing |
| `-f` | `--force` | Skip confirmation prompts |
| `-o` | `--output` | Output file or directory |
| `-c` | `--config` | Configuration file path |

Why reserve these: muscle memory. Developers expect `-v` to mean verbose in
every tool. Redefining it (e.g., `-v` for `--version`) causes confusion and
errors in automation scripts.

## Standard Flag Vocabulary

| Pattern | When to Use | Implementation |
|---------|-------------|----------------|
| Boolean toggle | On/off behavior | `--flag` / `--no-flag` via `BooleanOptionalAction` (Python 3.9+) |
| Mutually exclusive choices | Fixed set of modes | `choices=["json", "csv", "table"]` on a `--format` flag |
| Counting | Verbosity levels | `-vvv` via `action="count"` |

## Parser Setup

Keep parser construction separate from execution. This makes the parser
testable and keeps `main()` focused on dispatch.

```python
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="What this tool does",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-v", "--verbose", action="count", default=0,
        help="increase verbosity (-v, -vv, -vvv)",
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true",
        help="suppress non-essential output",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    verbosity = -1 if args.quiet else args.verbose
    configure_logging(verbosity)
    # Dispatch to handler
```

Why `RawDescriptionHelpFormatter`: it preserves your epilog formatting, which
is useful for showing examples in `--help` output.

## Subcommand Pattern

Use subcommands when a tool has multiple distinct operations. Each subcommand
gets its own handler function.

```python
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="My tool")
    sub = parser.add_subparsers(dest="command", required=True)

    # Shared flags via parent parser
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("-v", "--verbose", action="count", default=0)

    run_parser = sub.add_parser("run", parents=[common], help="Run the job")
    run_parser.set_defaults(func=handle_run)

    check_parser = sub.add_parser("check", parents=[common], help="Validate config")
    check_parser.set_defaults(func=handle_check)

    return parser
```

Why parent parsers: they prevent flag inconsistency. Without them, one
subcommand might spell it `--verbose` and another `--debug`, confusing users.

## Exit Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 0 | Success | Operation completed normally |
| 1 | General error | Runtime failure, unhandled exception |
| 2 | Usage error | Bad arguments, missing required flags |

Use `sys.exit(code)` explicitly rather than relying on unhandled exceptions,
which produce noisy tracebacks that obscure the actual problem.

## Output Conventions

| Content | Destination | Why |
|---------|-------------|-----|
| Structured data (JSON, CSV) | `stdout` | Allows piping to `jq`, `csvtool`, etc. |
| Human-readable messages | `stderr` | Keeps `stdout` clean for machine parsing |
| Progress indicators | `stderr` | Same reason -- do not pollute data output |
| Error messages | `stderr` | Standard Unix convention |

When a tool needs to serve both humans and machines, add a `--format` flag
with choices like `json`, `csv`, `table`. Default to `table` for interactive
use.

## Anti-patterns

- **Positional arguments for optional values.** Positional args should be
  required inputs (like a filename). Optional behavior belongs behind flags.
- **Inconsistent flag names across subcommands.** If `run` uses `--output` and
  `check` uses `--out`, users will misremember. Use parent parsers to enforce
  consistency.
- **Missing help text.** Every argument needs a `help=` string. Argparse
  generates `--help` from these -- blank entries make the tool look unfinished.
- **Printing errors to stdout.** This breaks piping. Errors go to `stderr`.
- **Hardcoded paths.** Use arguments or config files. Hardcoded paths break
  portability and make testing harder.

## See also

- `logging-standards` -- how to handle the verbosity levels these flags set
- `terminal-execution` -- safe patterns for running commands from Python
