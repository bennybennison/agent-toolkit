# Project Instructions

## Quickstart

When you first open this repo in VS Code with GitHub Copilot Chat:

1. Open Copilot Chat.
2. Start with one of the generated prompts in `.github/prompts/`.
3. Use the `session-manager` agent when you need to start, resume, inspect, or close a session cleanly.
4. Use the `orchestrator` agent for broad work requests.
5. For rough ideas, start with the `explore` prompt.
6. For placement or repo-fit questions, use the `map` prompt.
7. For bug diagnosis and repair, use the `repair` prompt.
8. For issue or PR review, prefer the `review-issue` or `review` prompt.
9. Treat older specialist names as internal sub-agents rather than the primary user-facing workflow.

## Startup

Before writing code, read:
1. `AGENTS.md` in the target package (if it exists)
2. `{{GOTCHAS_PATH}}` (if it exists)

## Code Standards

### Modular Code

Code must be organised into focused, single-purpose modules.

**Banned file names** (catch-all dumping grounds):
- `utils.ts` / `utils.py` → named modules by function (`string-helpers.ts`, `date-formatting.py`)
- `helpers.ts` / `helpers.py` → named by function (`validation.ts`, `parsing.py`)
- `misc.ts` / `misc.py` → find the right module or create a specific one
- `common.ts` / `common.py` → shared types → `types.ts`, shared constants → `constants.ts`

**Exception:** `utils/` as a directory is fine if each file is focused and named by purpose.

**Index files** (`index.ts`, `__init__.py`) are entry points only — pure re-exports, no business logic.

### File Size Caps

| File Type | Max Lines | Action |
|-----------|-----------|--------|
| Source files (`.py`, `.ts`, `.tsx`) | 300 | Split by responsibility |
| Test files | 500 | Split by test class |
| `AGENTS.md` | 200 | Move details to SKILL.md |

When creating or editing files, check line count. If approaching the cap, plan the split proactively.

### Security

- **Never** hardcode credentials, API keys, tokens, or passwords
- Use `pydantic-settings` with `BaseSettings` for typed config (Python)
- Use `dotenvx` for encrypted env management in non-local environments
- `.env` → local dev only, in `.gitignore`. `.env.keys` → NEVER committed
- All external input validated at API boundaries (Pydantic models or Zod schemas)

### Git Commits

- Imperative mood, focus on "why" not "what"
- One logical change per commit
- If a change touches 5+ files across different concerns, split into multiple commits
- Refactoring and behaviour changes are separate commits

## Documentation Hierarchy

- `AGENTS.md` per package (200 lines max) — "How do I work here?"
- `GOTCHAS.md` — known pitfalls and gotchas for this project
- One concept per file, test module cohesion

## Working Style

- Default: interactive coding-partner flow (short cycles, ask before large mutations)
- Choose implementation strategy explicitly when planning:
  - `outside-in`
  - `ui-first`
  - `inside-out`
  - `frontend-first`
  - `backend-first`
  - `infra-first`
  - `full-stack-staged`
  - `repair-first`
- Keep diffs minimal and reversible
- Prefer existing abstractions and conventions over inventing new ones
- Surface uncertainty explicitly rather than guessing
