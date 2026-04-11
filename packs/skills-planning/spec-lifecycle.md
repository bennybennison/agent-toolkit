---
skill: spec-lifecycle
scope: universal
profile: full
module: docs/specs
tags: [specs, planning, lifecycle, documentation]
---

# Skill: Spec Lifecycle

Manage specifications through a structured hierarchy and lifecycle — from epic vision to actionable tasks.

---

## When to Use

- Starting a new feature or system component
- Breaking down large initiatives into manageable specs
- Tracking spec status through implementation
- Ensuring alignment between specs, code, and governance docs

## Spec Hierarchy

Specs follow a four-level hierarchy. Each level has a different scope and owner:

```
Epic (Vision)
  └── Feature Spec (What to build)
        └── Story (User-facing slice)
              └── Task (Implementable unit)
```

| Level | Scope | Size | Owner | Example |
|-------|-------|------|-------|---------|
| **Epic** | Strategic initiative | Weeks-months | Project lead | "Order Management System" |
| **Feature Spec** | One complete capability | Days-weeks | Developer | "Order Processing Pipeline" |
| **Story** | User-visible behaviour | Hours-days | Developer | "User can view order status" |
| **Task** | Single implementation unit | Minutes-hours | Developer | "Add status field to Order model" |

## Spec Lifecycle States

Every spec moves through these states:

```
Draft → Active → Complete → [Deprecated]
```

| State | Meaning | Criteria to Enter |
|-------|---------|-------------------|
| **Draft** | Being written, not yet committed to | Author has outlined scope and acceptance criteria |
| **Active** | Committed, work has begun | Reviewed, no open questions, assigned |
| **Complete** | All acceptance criteria met | Code merged, tests passing, docs updated |
| **Deprecated** | Superseded or no longer relevant | Replacement spec linked, or explicit abandonment reason |

### State Transitions

- `Draft → Active`: All acceptance criteria defined, no open questions
- `Active → Complete`: All acceptance criteria verified, code merged
- `Active → Deprecated`: Requirements changed, spec superseded
- `Complete → Deprecated`: Feature removed or replaced

## Spec Format

Every feature spec should include these sections:

| Section | Purpose |
|---------|---------|
| **Header** | Status, Epic, Created/Updated dates |
| **Context** | Why this feature is needed |
| **Scope** | In scope / out of scope |
| **Acceptance Criteria** | Given/When/Then format |
| **Technical Approach** | How to implement (reference architecture) |
| **Stories** | Table of user-facing slices with status |
| **Open Questions** | Unresolved items (empty = ready for Active) |

## Spec File Organisation

```
plan/specs/
├── README.md                  # Epic Board (see below)
├── 00_MASTER_SPEC.md          # Product vision, roadmap, domain model
├── 01_order_processing.md     # Feature spec
├── 02_inventory_sync.md       # Feature spec
├── 03_reporting.md            # Feature spec
└── SPEC_GUIDELINES.md         # This lifecycle document (project-specific version)
```

### Naming Convention

- Prefix with two-digit number for ordering: `01_`, `02_`, etc.
- Use snake_case for the feature name
- `00_MASTER_SPEC.md` is always the top-level product spec

### Epic README Board

The `plan/specs/README.md` serves as a dashboard for all specs. It gives an at-a-glance view of project progress:

```markdown
# {Project Name} — Spec Board

## Active Epics

### {Epic Name}
> Status: Active | Started: {Date}

| # | Spec | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 01 | [Order Processing](01_order_processing.md) | Active | @dev | In progress |
| 02 | [Inventory Sync](02_inventory_sync.md) | Draft | — | Needs review |
| 03 | [Reporting](03_reporting.md) | Complete | @dev | Merged 2025-01-15 |

## Completed Epics
(Move epics here when all specs are complete)
```

Update this board whenever a spec changes status. It is the single source of truth for "what's the project status?"

## Spec-Code Alignment

Specs and code must stay in sync. When code changes diverge from the active spec:

1. **Small divergence** — update the spec to reflect reality
2. **Large divergence** — stop coding, discuss with stakeholders, update spec first
3. **Spec is wrong** — fix the spec, then continue coding

### Verification Checklist

When completing a spec:

- [ ] All acceptance criteria have corresponding tests
- [ ] AGENTS.md updated if architecture changed
- [ ] SKILL.md updated if public API changed
- [ ] GOTCHAS.md updated if non-obvious issues were discovered
- [ ] Spec status changed to Complete
- [ ] Related stories all marked Complete

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Write specs after the code is done | Write spec first, even if brief |
| Leave specs in Draft forever | Move to Active when work begins |
| Skip acceptance criteria | Every spec needs Given/When/Then criteria |
| Let specs diverge from reality | Update spec when code changes |
| Create specs for trivial tasks | Specs are for features, not bug fixes |
| Write 50-page specs | Keep feature specs under 200 lines |

---

## Cross-Referencing Rules

When specs reference shared concepts:

| Situation | Action |
|-----------|--------|
| Two specs share a domain entity | Define entity in the earlier spec, reference from the later |
| Spec depends on another spec | Add "Depends on: [spec name](link)" in Context section |
| Spec supersedes another | Mark old spec Deprecated, link to new spec |
| Spec shares acceptance criteria with another | Extract shared criteria to parent epic or master spec |

### "What Goes Where" Routing Table

| Content Type | Where It Lives |
|--------------|---------------|
| Product vision and roadmap | `00_MASTER_SPEC.md` |
| Feature requirements and acceptance criteria | Feature spec (`01_feature.md`) |
| Architecture decisions | ADR in `plan/decisions/` |
| Implementation patterns | AGENTS.md |
| API surface documentation | SKILL.md |
| Lessons learned | GOTCHAS.md |
| Status dashboard | `plan/specs/README.md` (Epic Board) |

---

## See Also

- [review-specs](review-specs.md) — Deduplication and cross-referencing workflow
- [document-ownership](document-ownership.md) — Which docs to update when
- [blueprint](blueprint.md) — Creating technical plans
- [post-work-update](post-work-update.md) — Checklist for updating docs after work
