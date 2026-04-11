---
skill: review-specs
scope: universal
profile: full
tags: [specs, deduplication, cross-reference, planning]
---

# Skill: Spec Review and Deduplication

Structured workflow for finding and resolving duplicate, overlapping, or conflicting specifications. Extracted from spec management practices in projects that maintain a `plan/specs/` directory. Without active deduplication, spec systems accumulate contradictions that silently undermine implementation.

---

## When to Use

- **Before creating a new spec** -- to avoid writing something that already exists
- **When specs reference overlapping functionality** -- to clarify ownership boundaries
- **During periodic spec cleanup passes** -- to keep the spec system healthy
- **After a major scope change** -- specs written before the change may now conflict

## 4-Step Deduplication Process

### Step 1 -- Keyword Search

Before writing a new spec, search existing specs for related content. This catches obvious duplicates early.

```bash
# Search by feature name and domain concepts
rg "order processing\|order management\|order status" plan/specs/

# Check the master index for related entries
cat plan/specs/00_MASTER_SPEC.md

# Search adjacent directories (specs often reference governance docs)
rg "order" plan/specs/ AGENTS.md GOTCHAS.md
```

Search using multiple terms: the feature name, the domain concept, and keywords from the user story. Specs describing the same thing often use different vocabulary.

### Step 2 -- Adjacent-Spec Lookup

For each related spec found in Step 1:

1. **Read the full spec**, not just the title -- titles can be misleading
2. **Note overlapping acceptance criteria** -- two specs with the same Given/When/Then are duplicates
3. **Note conflicting definitions** -- if Spec A says "an order can have one status" and Spec B implies multiple concurrent statuses, that is a conflict
4. **Check the spec's status** -- a Deprecated spec that overlaps is fine; an Active one is a problem

### Step 3 -- Classify and Cross-Reference

For each overlap found, classify it and take the appropriate action:

| Overlap Type | Definition | Action |
|--------------|------------|--------|
| **Duplicate** | Two specs describe the same feature | Consolidate into one, delete the other |
| **Overlapping** | Specs share some scope but are mostly distinct | Extract shared part into a parent spec, reference it from both |
| **Complementary** | Specs cover adjacent features that interact | Add cross-references, verify no contradictions |
| **Conflicting** | Specs make incompatible claims about the same concept | Escalate to stakeholders, document the resolution |

When consolidating, prefer keeping the spec with more detail or more recent updates. Transfer any unique acceptance criteria from the deleted spec into the surviving one.

### Step 4 -- Update References

After any consolidation or deletion, update all downstream references. Broken spec links erode trust in the spec system.

1. Update `00_MASTER_SPEC.md` index to reflect changes
2. Search all specs for references to changed/deleted spec numbers or names
3. Update any `AGENTS.md` files that referenced the modified specs
4. Verify no broken links remain: `rg "spec.*deleted_spec_name" plan/`

## Spec Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Prefix | Two-digit number | `01_`, `02_` |
| Name | snake_case feature name | `user_auth` |
| Full filename | `{number}_{feature_name}.md` | `01_user_auth.md` |

Numbers indicate creation order, not priority or dependency order. Renumbering specs to reflect priority creates unnecessary churn and breaks references.

## Quality Checklist

Run this checklist against each spec during review:

- [ ] Has a clear scope boundary (explicit "In Scope" and "Out of Scope" sections)
- [ ] Has measurable acceptance criteria (Given/When/Then format)
- [ ] References related specs by name and number
- [ ] Assigned to an epic (if the project uses epic structure)
- [ ] Status is current (Draft/Active/Complete/Deprecated)
- [ ] No acceptance criteria that duplicate or contradict another spec
- [ ] No orphaned references to deleted or renamed specs

## Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Two specs describing the same feature differently | Implementers get contradictory guidance | Consolidate before implementation begins |
| Circular spec references without a shared parent | Creates confusion about which spec owns the concept | Extract the shared concept into its own spec |
| Acceptance criteria that contradict another spec | Tests will pass individually but the system is incoherent | Resolve conflicts explicitly, document the decision |
| Master spec containing all detail | Becomes unmaintainable, defeats the purpose of sub-specs | Master spec indexes and summarizes; detail lives in sub-specs |
| Skipping Step 1 before writing a new spec | Leads to gradual duplication that is expensive to fix later | Always search first, even if you are confident the topic is new |

---

## See Also

- [spec-lifecycle](spec-lifecycle.md) -- lifecycle states and transitions for individual specs
- [document-ownership](document-ownership.md) -- who is responsible for maintaining which docs
- [blueprint](blueprint.md) -- higher-level architecture planning that feeds into specs
