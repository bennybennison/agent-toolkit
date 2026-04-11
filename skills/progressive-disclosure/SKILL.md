---
name: "progressive-disclosure"
description: "Load context in layers — start minimal, deepen only when needed. This prevents context bloat and keeps the agent focused."
pack: "skills-core"
---

# Skill: Progressive Disclosure

Load context in layers — start minimal, deepen only when needed. This prevents context bloat and keeps the agent focused.

---

## When to Use

- Starting a new session in a project
- Deciding which governance files to read first
- Managing context window budget in long sessions
- Designing documentation structure for a project

## The Five Layers

Context loads in five layers, from most essential to most detailed:

| Layer | What | Size Cap | Load When |
|-------|------|----------|-----------|
| **L1: Identity** | `copilot-instructions.md` or root AGENTS.md | < 400 lines | Always (auto-loaded) |
| **L2: Package** | Package-level AGENTS.md | < 200 lines | Working in that package |
| **L3: Capability** | SKILL.md for the package | < 400 lines | Need to use the package's API |
| **L4: History** | GOTCHAS.md, FRICTION_LOG.md | < 200 lines each | Debugging or making changes |
| **L5: Planning** | Specs, ADRs, CONSTITUTION.md | Varies | Architecture decisions, new features |

### Loading Rules

1. **Always load L1** — this is automatic via `opencode.json` instructions
2. **Load L2 when entering a package** — read the package's AGENTS.md before modifying its code
3. **Load L3 on demand** — only read SKILL.md when you need to call the package's API
4. **Load L4 when stuck** — read GOTCHAS.md when debugging, FRICTION_LOG.md when hitting pain points
5. **Load L5 for planning** — read specs and CONSTITUTION.md when making architecture decisions

### Why This Matters

Context window is finite. Loading everything upfront:
- Wastes tokens on irrelevant context
- Increases risk of compaction losing important details
- Slows down the agent with unnecessary information
- Makes it harder to find what's actually relevant

## Document Size Caps

These caps exist to enforce progressive disclosure at the authoring level:

| Document | Hard Cap | If Exceeded |
|----------|----------|-------------|
| `copilot-instructions.md` | 400 lines | Move details to AGENTS.md files |
| Root AGENTS.md | 200 lines | Move package details to package-level AGENTS.md |
| Package AGENTS.md | 200 lines | Split into sub-packages or move API details to SKILL.md |
| SKILL.md | 400 lines | Split by capability area into multiple SKILL.md in sub-packages |
| Source files | 300 lines | Use split-large-file skill |

### What to Do When a Document Exceeds Its Cap

1. **Identify content that belongs at a different layer** — API details in AGENTS.md should move to SKILL.md
2. **Split by scope** — a 300-line AGENTS.md probably covers multiple packages
3. **Reference instead of repeat** — link to detailed docs rather than inlining them
4. **Remove obvious information** — if it's in CONSTITUTION.md, don't repeat it

## Context Budget

For a typical context window (~200k tokens), budget roughly:

| Category | Budget | Notes |
|----------|--------|-------|
| System prompt + rules | ~10% | Auto-loaded by framework |
| Active governance docs | ~5% | L1-L2, occasionally L3-L4 |
| Code being worked on | ~30% | Files read/edited in this session |
| Tool outputs | ~30% | Search results, build output, test results |
| Conversation history | ~20% | User messages and agent responses |
| Reserve | ~5% | Buffer for unexpected needs |

When approaching the budget:
1. Use strategic compaction (see `strategic-compact` skill)
2. Don't load L4-L5 unless specifically needed
3. Rely on search tools rather than reading entire files

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Read every governance file at session start | Load L1 only, deepen as needed |
| Put everything in root AGENTS.md | Distribute across layers |
| Read SKILL.md for a package you're not calling | Load L3 only when needed |
| Read CONSTITUTION.md for a simple bug fix | L5 is for architecture decisions |
| Inline full file contents in governance docs | Reference file paths, let the agent read on demand |
| Ignore size caps "because the content is important" | Important content can be structured across layers |

---

## See Also

- [strategic-compact](../strategic-compact/SKILL.md) — When and how to compress context
