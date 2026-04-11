---
description: Diagnose a defect, repair it, and verify the fix without turning the task into a broad redesign.
interaction_policy: mutate-only
capability_ceiling: mutate
contracts: DiagnosisNote, VerificationReport
skills: using-agent-toolkit, bug-diagnosis, verification-loop
specialists: researcher, build-fixer, builder, verifier, tdd-runner
---

# Repair And Verify

Use this recipe for bug fixing, failing test recovery, and regression repair where the goal is a targeted fix with evidence, not a large exploratory rewrite.

Bias toward minimal change and strong verification.
