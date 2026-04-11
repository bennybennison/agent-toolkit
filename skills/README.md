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

`SKILL.md` should include frontmatter with at least:

- `name`
- `description`

Toolkit-only metadata may also be present:

- `pack`
  - the pack that composes this skill into install profiles
- `starter`
  - marks a host-neutral starter skill that should always be available in the shared library

Toolkit metadata is stripped from the installed `.agents/skills/.../SKILL.md` surface. The installed skill keeps a clean portable skill contract.

## Relationship To Packs

Packs remain the composition and selection layer.

That means:

- skills are authored here
- packs decide when a skill is included
- adapters project the selected toolkit resources into host-native surfaces

During migration, some older skill content may still exist in `packs/skills-*/` or adapter templates. Shared skill installs now prefer this directory first and only fall back to those older sources when a migrated authored skill does not exist here yet.
