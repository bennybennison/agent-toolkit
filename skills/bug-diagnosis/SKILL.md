---
name: "bug-diagnosis"
description: "Treat diagnosis as a first-class phase before fixing a bug, unstable behavior, or weird operational issue."
pack: "skills-discovery"
---

# Skill: Bug Diagnosis

Treat diagnosis as a first-class phase before fixing a bug, unstable behavior, or weird operational issue.

## Goal

Produce a `BugDiagnosis` artifact that records:

- symptoms
- reproduction conditions
- affected area
- evidence gathered
- likely causes
- next fix direction
- verification plan

Use the template in `templates/workflows/BUG_DIAGNOSIS.md` when creating the artifact.

## Process

1. State the observed behavior precisely
2. Reproduce it or define the missing reproduction blocker
3. Narrow the affected area
4. Gather concrete evidence:
   - logs
   - failing tests
   - bad inputs
   - broken outputs
5. List the most plausible causes in ranked order
6. Choose the next repair direction
7. Define how the fix will be verified

## Output

Capture:

- symptom summary
- reproduction status
- affected files or systems
- evidence
- likely causes
- next fix step
- verification plan

## Anti-Patterns

- Fixing before reproducing
- Naming a root cause without evidence
- Treating build failures as the only kind of repair work
