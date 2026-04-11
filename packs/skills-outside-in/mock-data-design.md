---
skill: mock-data-design
scope: universal
profile: standard, full
tags: [product-design, mocks, data]
---

# Skill: Mock Data Design

Create believable mock data that proves whether the workflow and UI can actually work.

## Goal

Produce a `MockDataset` that covers:

- normal cases
- edge cases
- error or exception cases
- realistic record shapes

## Rules

- Use realistic values, not placeholder nonsense.
- Include just enough data to exercise the workflow.
- Include edge cases that would change user decisions.
- Prefer representative examples over huge synthetic datasets.

## Include Cases Like

- healthy / expected records
- missing data
- delayed data
- conflicting states
- records needing intervention

## Anti-Patterns

- Perfect data only
- Abstract schemas with no sample values
- Large datasets that add volume but not insight
