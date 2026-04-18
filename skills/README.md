# Shared Skills

This directory is the toolkit-owned authored source for portable shared skills.

Installed shared skills are materialized into:

- project scope: `.agents/skills/<name>/SKILL.md`
- global scope: `~/.agents/skills/<name>/SKILL.md`

## Contract

Each shared skill lives in its own folder:

```text
skills/
  <skill-name>/
    SKILL.md
```

Skills may also include nested support files when that improves clarity:

```text
skills/
  <skill-name>/
    SKILL.md
    references/
    templates/
    examples/
```

`SKILL.md` should include frontmatter with at least:

- `name`
- `description`

Toolkit-only metadata may also be present:

- `pack`
  - the pack that composes this skill into install profiles
- `starter`
  - marks a host-neutral starter skill that should always be available in the shared library

Toolkit metadata is stripped from the installed `.agents/skills/.../SKILL.md` surface. The installed skill keeps a clean portable skill contract.

## Support Files

Nested support files are allowed when they are clearly part of the same skill.

Use them for:

- domain-specific reference material
- deeper examples
- support templates
- related details that would make `SKILL.md` too long or too noisy

Rules:

- `SKILL.md` remains the clear and discoverable entrypoint
- `SKILL.md` should point to any nested files that matter and explain when to
  open them
- nested files support the parent skill; they do not replace it
- if a concept should be independently discoverable across multiple domains, it
  should usually be its own skill rather than a buried support file
- keep related material grouped, but do not hide broadly reusable capabilities

## Relationship To Packs

Packs remain the composition and selection layer.

That means:

- skills are authored here
- packs decide when a skill is included
- adapters project the selected toolkit resources into host-native surfaces

During migration, some older skill content may still exist in `packs/skills-*/` or adapter templates. Shared skill installs now prefer this directory first and only fall back to those older sources when a migrated authored skill does not exist here yet.

Some skills may point to first-class toolkit contracts under `contracts/` and
to durable artifact conventions such as `.agent-artifacts/`. Skills teach usage
and routing; they do not become the canonical owner of contract definitions.
