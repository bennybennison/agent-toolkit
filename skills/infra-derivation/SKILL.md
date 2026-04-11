---
name: "infra-derivation"
description: "Derive infrastructure and delivery needs only after the workflow and contracts are validated."
pack: "skills-outside-in"
---

# Skill: Infra Derivation

Derive infrastructure and delivery needs only after the workflow and contracts are validated.

## Goal

Produce:

- `InfraRequirementSpec`
- implementation-ready infra notes for the validated slice

## Consider

- authentication and roles
- persistence and caching
- background jobs
- scheduling
- file handling
- deployment model
- observability and alerting

## Rule

Infra should be justified by validated workflow behavior, not imagined platform completeness.

## Questions

1. What needs to be persisted?
2. What needs to happen asynchronously?
3. What permissions does each user role need?
4. What failures must be observable?
5. What minimum deployment shape supports the validated slice?

## Anti-Patterns

- Designing for scale before proving usefulness
- Adding queues, events, or microservices with no validated need
- Treating ops architecture as the first design activity
