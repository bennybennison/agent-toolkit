---
name: "doc-coauthoring"
description: "A structured three-stage workflow for creating documentation that is actually"
pack: "skills-planning"
---

# Skill: Collaborative Document Authoring

A structured three-stage workflow for creating documentation that is actually
useful. Most docs fail not because of bad writing, but because the author
skipped context gathering or never tested the doc from the reader's perspective.

---

## When to Use

- Writing any new documentation (README, AGENTS.md, SKILL.md, tutorials, ADRs)
- Rewriting docs that users report as confusing or incomplete
- Collaborating with a human on documentation where the agent drafts and the human refines
- Onboarding a new project that lacks documentation

## Stage 1 -- Context Gathering

Before writing a single line, answer these four questions. Writing without
this context produces docs that are technically correct but useless in practice.

### 1. Identify the Audience

Who will read this? What do they already know? An API reference for external
consumers requires different context than an AGENTS.md for AI agents working
inside the codebase.

### 2. Identify the Purpose

What should the reader be able to **do** after reading this document? If you
cannot state this in one sentence, the document's scope is too broad -- split it.

### 3. Gather Source Material

Read before you write:
- Existing code and comments
- Related documentation (check for duplication before creating new docs)
- Conversation history or issue threads that prompted this work
- Specs or ADRs that define the design

### 4. Identify the Format

Choose the right document type. Each type has established conventions:

| Type | Audience | Purpose | Structure |
|------|----------|---------|-----------|
| README | New developers | Onboard to project | What, Why, How, Quick Start |
| AGENTS.md | AI agents | Navigate codebase | Key Files, Patterns, Gotchas |
| SKILL.md | AI agents / devs | Use a package's API | Methods, Parameters, Examples |
| API docs | External consumers | Integrate with API | Endpoints, Auth, Examples |
| Tutorial | Learners | Build something step-by-step | Sequential, hands-on |
| ADR | Future developers | Understand decisions | Context, Decision, Consequences |

## Stage 2 -- Drafting and Refinement

### Step 1: Outline First

Write headings only -- no content yet. This forces you to think about structure
before getting lost in prose. Share the outline with the human collaborator for
feedback before filling it in.

### Step 2: Fill In Section by Section

Work through each heading. For each section:
- Start with the most common case, then cover edge cases
- Use concrete examples rather than abstract descriptions
- Keep paragraphs short (3-5 lines) -- dense walls of text go unread

### Step 3: Apply Progressive Disclosure

The most important information goes first. Details, caveats, and edge cases
come later. A reader should be able to stop reading at any point and still have
gotten the most valuable information available up to that point.

### Step 4: Review for Consistency

Before finalizing, check:
- Terminology is used consistently (don't switch between "module" and "package" for the same thing)
- Formatting follows the project's conventions
- Voice is consistent (imperative for instructions, declarative for reference)
- Cross-references point to real documents that exist

## Stage 3 -- Reader Testing

This is the stage most people skip, and it is the most valuable. The author has
context bias -- you will mentally fill in gaps that the reader cannot.

### Self-Testing

1. Re-read the document as if you have never seen the codebase
2. Can you follow the instructions and achieve the stated purpose?
3. Is any jargon used without definition?
4. Are there assumptions that are not stated?

### Cross-Agent Testing

If subagents are available, have a **different** agent read and critique the
document. The authoring agent has seen the source material and will
unconsciously compensate for gaps in the text. A fresh reader will not.

Prompt for the reviewing agent:
```
Read this document. Your task is to follow its instructions to achieve
[stated purpose]. Note every point where you are confused, where you need
information the document does not provide, or where you would make a
different choice than the document recommends.
```

## Writing Quality Checklist

Run this before declaring the document done:

- [ ] Purpose stated in the first paragraph
- [ ] No jargon used without definition
- [ ] Code examples are runnable (not pseudocode unless explicitly labeled)
- [ ] Common cases shown first, edge cases second
- [ ] Tables used for reference data instead of prose
- [ ] Cross-references to related documents included
- [ ] Document is under 200 lines (or split into multiple docs)
- [ ] No duplication of content that lives in another document

## Anti-Patterns

| Don't | Why It Fails | Do Instead |
|-------|-------------|------------|
| Write docs nobody asked for | Creates maintenance burden without value | Wait for a real need before documenting |
| Document volatile implementation details | Goes stale immediately, erodes trust in all docs | Document interfaces and contracts instead |
| Wall of text without structure | Readers scan, they don't read linearly | Use headings, tables, and short paragraphs |
| Screenshots of terminal output | Cannot be searched, copied, or updated | Use fenced code blocks |
| Duplicate content from other docs | Creates contradictions when one copy is updated | Reference the source document instead |
| Skip the outline step | Produces rambling, poorly structured docs | Always write headings before content |

## See also

- `progressive-disclosure` -- the layered context model that determines document sizing and loading
- `document-ownership` -- where different types of information belong
- `post-work-update` -- updating documentation after completing work
