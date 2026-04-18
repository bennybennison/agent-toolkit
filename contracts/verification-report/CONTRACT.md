# Contract: VerificationReport

## Purpose

`VerificationReport` captures what was checked, what happened, and whether the
work should be considered verified.

## When To Use

Use `VerificationReport` for:

- `repair-and-verify`
- implementation completion
- signoff or handoff that needs evidence

## Required Sections

- checks run
- evidence
- signoff recommendation

## Notes

- this report should prefer concrete commands and observable results
- if verification was partial, that should be stated explicitly

## Related Contracts

- `task-brief`
- `build-proposal`
- `audit-report`
