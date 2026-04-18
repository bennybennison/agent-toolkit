# Contract: TaskBrief

## Purpose

`TaskBrief` is the minimal execution brief for a unit of work.

It tells the system:

- what the task is
- what is in and out of scope
- what constraints apply
- what operating mode is allowed
- what recipe is being used
- how tightly the user wants confirmation

## When To Use

Use `TaskBrief` whenever work moves beyond an informal chat reply and into a
structured workflow such as:

- planning
- implementation
- repair
- review
- handoff

## Required Fields

- `missionId`
- `intent`
- `scope`
- `constraints`
- `operationStyle`
- `mode`
- `crThreshold`

## Optional Fields

- `capabilityCeiling`
- `interactionPolicy`
- `recipeId`
- `strategy`

## Notes

- `scope.include` should name what is intentionally in scope.
- `scope.exclude` should name known exclusions or protected areas.
- `constraints` should capture user, architectural, or environmental limits.
- `recipeId` should match a toolkit recipe when the task is running under a
  recipe-driven flow.

## Related Contracts

- `plan`
- `map-report`
- `build-proposal`
- `audit-report`
- `verification-report`
- `context-bundle`
