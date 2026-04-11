---
name: "split-large-file"
description: "Safely split source files exceeding the 300-line cap."
pack: "skills-core"
---

# Skill: Split Large File

Safely split source files exceeding the 300-line cap.

---

## When to Use

A source file exceeds **300 lines** and has natural split boundaries.

**Do NOT split when:**
- File is 300-350 lines and tightly coupled (circular import risk)
- File is a spec, CONSTITUTION, or reference doc (exempt)
- Resulting files would each be < 50 lines (too granular)

---

## Process

### 1. Identify Split Boundaries

| Signal | Split By |
|--------|----------|
| Multiple classes | One file per class |
| Grouped API endpoints | One file per API entity |
| Distinct responsibilities | One file per responsibility |
| Helpers used by one caller | Move into caller's file |

### 2. Plan the Split

Before writing code:

1. Map every public symbol (functions, classes, constants)
2. Map every import (who imports what from this file)
3. Choose new file names: `{original}_{responsibility}.py`
4. Check for circular imports — if A and B would import each other, reconsider

### 3. Create New Files

For each new file:
- Copy the relevant section
- Add only the imports that section needs
- Include a module docstring

### 4. Update Original — Barrel File (preferred)

Keep the original as a re-export layer:

```python
# pricing.py -- barrel re-exporting sub-modules
from .pricing_eligible import get_eligible_pricing, EligiblePriceResult
from .pricing_batch import batch_update_prices, BatchPriceResult

__all__ = [
    "get_eligible_pricing",
    "EligiblePriceResult",
    "batch_update_prices",
    "BatchPriceResult",
]
```

This way existing imports continue to work.

### 5. Verify

1. Run tests: `uv run pytest`
2. No file exceeds 300 lines
3. No file under 50 lines
4. Update AGENTS.md with new file list

---

## Naming Conventions

| Original | Split Pattern |
|----------|--------------|
| `pricing.py` | `pricing_eligible.py`, `pricing_batch.py` |
| `reports.py` | `reports_settlement.py`, `reports_fees.py` |

---

## Checklist

- [ ] Identified natural split boundaries (not arbitrary line cuts)
- [ ] Mapped all public symbols and importers
- [ ] Created barrel file OR updated all import sites
- [ ] Each new file: 50-300 lines, has module docstring
- [ ] Tests pass after split
- [ ] AGENTS.md updated with new file list
