# Artifact Storage Reference

Use this reference when you need the default file-first layout for durable
contract-backed artifacts.

## Default Layout

```text
.agent-artifacts/
  context-bundles/
  handoffs/
  plans/
  verification/
  decisions/
```

## Folder Meanings

| Folder | Use For |
|--------|---------|
| `context-bundles/` | stitched context another agent or later session should load |
| `handoffs/` | compact summaries, change handoffs, next-step bundles |
| `plans/` | plan, wireframe, or proposal artifacts |
| `verification/` | verification reports, diagnosis notes, repair evidence |
| `decisions/` | hold notes, escalation notes, decision records for active work |

## Naming Guidance

Prefer filenames that make the artifact easy to find later.

Good patterns:

- `{task-name}.md`
- `{date}-{task-name}.md`
- `{ticket-or-issue}-{artifact-type}.md`

## Relationship To Contracts

The folder does not define the artifact structure.

The contract does.

Use:

- `contracts/<contract-id>/CONTRACT.md` for meaning
- `contracts/<contract-id>/TEMPLATE.md` for structure

## Relationship To Runtime

This layout should remain useful even with no runtime attached.

That is the point.
