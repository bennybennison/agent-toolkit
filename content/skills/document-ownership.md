---
skill: document-ownership
scope: universal
profile: standard, full
tags: [documentation, governance, ownership, hierarchy]
---

# Skill: Document Ownership Map

Define clear ownership and hierarchy for governance documents to prevent duplication and contradiction.

---

## When to Use

- Setting up governance for a new project
- Resolving conflicts between governance documents
- Deciding where to put new information
- Auditing documentation for duplication or staleness

## Hierarchy of Truth

When governance documents conflict, the higher-level document wins:

```
CONSTITUTION.md          (philosophy, principles — rarely changes)
    ↓
project-control spec     (governance rules, document ownership)
    ↓
spec-guidelines          (how to write specs)
    ↓
Feature specs            (what to build)
    ↓
AGENTS.md / SKILL.md     (how to work with code)
    ↓
Code                     (the implementation)
```

**Rule:** Information flows downward. Lower documents reference higher ones but never contradict them.

## The Four Pillars

Every project's documentation falls into four pillars. Each pillar has a clear owner and purpose:

| Pillar | Purpose | Documents | Owner |
|--------|---------|-----------|-------|
| **Philosophy** | Why we do things this way | CONSTITUTION.md | Project lead |
| **Planning** | What we're building | Specs, ADRs, TODO | Developer + lead |
| **Guidance** | How to work with the code | AGENTS.md, SKILL.md, GOTCHAS.md | Developer |
| **Tracking** | What happened, what hurts | FRICTION_LOG.md, CHANGELOG | Developer |

### Ownership Rules

1. Each document has **one owner** — the person responsible for keeping it current
2. Documents should **not duplicate** content from other documents — reference instead
3. If the same information appears in two documents, one must be declared the source of truth and the other must reference it

## Document Responsibility Matrix

| Document | Contains | Does NOT Contain | Updated When |
|----------|----------|------------------|--------------|
| **CONSTITUTION.md** | Architecture philosophy, principles, non-negotiables | Implementation details, current status | Architecture changes |
| **AGENTS.md** (root) | Project-wide rules, tech stack, coding standards | Package-specific details, API references | New patterns or tools adopted |
| **AGENTS.md** (package) | Package purpose, key files, constraints, patterns | Project-wide rules (reference root instead) | Package structure changes |
| **SKILL.md** | Public API reference, capability map, usage examples | Internal implementation details | API changes |
| **GOTCHAS.md** | Non-obvious issues, solved problems, traps | General coding standards (that's AGENTS.md) | Bug discoveries |
| **FRICTION_LOG.md** | Pain points, tooling issues, workflow friction | Solutions (that's GOTCHAS.md or code) | Friction experienced |
| **Specs** | What to build, acceptance criteria, scope | How to code it (that's AGENTS.md) | Feature planning |
| **CHANGELOG.md** | What changed and when | Why it changed (that's the spec or ADR) | Each release/milestone |
| **ADRs** | Architecture decisions and rationale | Implementation code | Architecture decisions |

## Preventing Duplication

### The Reference Rule

If content exists in a higher-level document, lower-level documents must **reference** it, not repeat it:

```markdown
<!-- Bad — duplicating CONSTITUTION content in AGENTS.md -->
## Architecture
We use Clean Architecture with 4 layers: Interface, Application, Domain, Infrastructure...
[200 lines repeating CONSTITUTION content]

<!-- Good — referencing CONSTITUTION from AGENTS.md -->
## Architecture
See CONSTITUTION.md for architecture principles. This package implements the
Infrastructure layer, specifically the database adapters.
```

### The "Where Does This Go?" Decision Tree

```
Is it a principle or philosophy?
├── Yes → CONSTITUTION.md
└── No → Is it about what to build?
    ├── Yes → Feature spec
    └── No → Is it about how to work with existing code?
        ├── Yes → Is it about the public API?
        │   ├── Yes → SKILL.md
        │   └── No → AGENTS.md
        └── No → Is it a non-obvious issue or trap?
            ├── Yes → GOTCHAS.md
            └── No → Is it a pain point without a solution?
                ├── Yes → FRICTION_LOG.md
                └── No → Does it record a decision and its rationale?
                    ├── Yes → ADR
                    └── No → Probably doesn't need a document
```

## Audit Checklist

Run this checklist quarterly (or when onboarding a new team member):

- [ ] Every document has a clear owner
- [ ] No content is duplicated across documents (search for overlapping headings)
- [ ] Lower documents reference higher documents instead of repeating them
- [ ] All AGENTS.md files are under 200 lines
- [ ] All SKILL.md files are under 400 lines
- [ ] GOTCHAS.md entries have resolution status
- [ ] Deprecated specs are marked as such
- [ ] FRICTION_LOG.md has been reviewed in the last month

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Copy CONSTITUTION principles into every AGENTS.md | Reference CONSTITUTION.md |
| Put API docs in AGENTS.md | Use SKILL.md for API reference |
| Mix pain points with solutions | Pain points in FRICTION_LOG, solutions in GOTCHAS or code |
| Let documents go stale without an owner | Assign ownership in this matrix |
| Create new document types without purpose | Use the four pillars — most info fits existing categories |
