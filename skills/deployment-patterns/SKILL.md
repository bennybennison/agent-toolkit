---
name: "deployment-patterns"
description: "Platform-agnostic patterns for containerization, CI/CD pipelines, and deployment strategies. These patterns apply regardless of hosting provider -- the principles are about process discipline, not vendor features."
pack: "skills-ops"
---

# Skill: Deployment Patterns

Platform-agnostic patterns for containerization, CI/CD pipelines, and deployment strategies. These patterns apply regardless of hosting provider -- the principles are about process discipline, not vendor features.

---

## Containerization (Docker)

### Multi-Stage Builds

Separate build dependencies from the runtime image. The production image should contain only what is needed to run the application.

```dockerfile
# Stage 1: Build
FROM python:3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev

# Stage 2: Production
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
USER appuser
HEALTHCHECK CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
CMD [".venv/bin/python", "-m", "app"]
```

Why multi-stage: Build tools, compilers, and dev dependencies inflate images. A Python build image can be 1GB+; the runtime image with just the venv can be under 200MB.

### Container Rules

| Rule | Why |
|------|-----|
| One process per container | Separation of concerns, independent scaling, clear logs |
| Non-root user in production | Limits blast radius if the container is compromised |
| Pin base image versions (`python:3.12-slim`) | `latest` tag changes without warning, breaking builds |
| Include `HEALTHCHECK` instruction | Orchestrators need to know when the container is ready |

### .dockerignore

Always include a `.dockerignore` to prevent unnecessary files from entering the build context:

```
.git
.env
.venv
__pycache__
node_modules
*.pyc
.pytest_cache
.mypy_cache
```

Why: A bloated build context slows down every build and risks leaking secrets (`.env`) into the image.

---

## Docker Compose

For local development and simple deployments. Structure services clearly.

| Practice | Example |
|----------|---------|
| Descriptive service names | `web`, `db`, `redis`, `worker` |
| Environment from `.env` file | `env_file: .env` (never hardcode secrets in compose) |
| Named volumes for persistence | `volumes: [db-data:/var/lib/postgresql/data]` |
| Network isolation | Separate `frontend` and `backend` networks |
| Health-check-aware depends_on | `depends_on: { db: { condition: service_healthy } }` |

Why health-check-aware depends_on: Without it, `depends_on` only waits for the container to start, not for the service inside it to be ready. Your app will crash trying to connect to a database that is still initializing.

---

## CI/CD Pipeline

### Pipeline Stages

```
lint -> test -> build -> deploy
```

Each stage gates the next. If linting fails, tests do not run. If tests fail, nothing gets built.

### Pipeline Principles

1. **Run tests before building artifacts** -- do not waste time building an image from broken code.

2. **Build once, deploy everywhere** -- the same artifact (container image, binary) goes to staging and production. Environment-specific configuration comes from environment variables, not separate builds. Why: "It worked in staging" is only meaningful if staging runs the exact same artifact as production.

3. **Environment config via environment variables** -- not config files baked into the image, not separate branches per environment.

4. **Automated rollback on health check failure** -- if the new version fails health checks after deployment, automatically revert to the previous version.

5. **No manual steps** -- if a human must SSH somewhere or click a button mid-pipeline, the pipeline is incomplete.

---

## Environment Management

### Environment Progression

```
Development -> Staging -> Production
```

- **Development**: Local or shared dev environment. Permissive, fast iteration.
- **Staging**: Production-like. Same infrastructure, same config structure, smaller scale.
- **Production**: The real thing. Changes here go through the full pipeline.

### Key Practices

- **Feature flags over long-lived branches** -- deploy to production behind a flag, not on a branch that diverges for weeks. Long-lived branches cause painful merges and hide integration issues.
- **Database migrations as a separate step** -- not during application startup. Why: if you have multiple application instances starting simultaneously, they will all try to run migrations concurrently, causing race conditions or lock contention.
- **Secrets via environment variables or a secret manager** -- never committed to the repository, never baked into images.

---

## Health Checks

Two distinct endpoints serving different purposes:

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `/health` (liveness) | "Is the process alive?" | Returns 200 if the app can handle HTTP requests |
| `/ready` (readiness) | "Can it serve traffic?" | Checks DB connection, cache, external dependencies |

Why separate: A process might be alive but not ready (still warming up, lost DB connection). The orchestrator should stop routing traffic to unready instances but should not kill and restart a process just because a dependency is temporarily down.

---

## Deployment Strategies

| Strategy | When to Use | How It Works |
|----------|------------|--------------|
| Rolling update | Default for most services | Replace instances one at a time; always some capacity available |
| Blue-green | Zero-downtime with instant rollback needed | Run two full environments; switch traffic atomically |
| Canary | Risk-sensitive changes, testing with real traffic | Route a small percentage of traffic to the new version first |

Decision: Start with rolling updates. Move to blue-green or canary when you have the infrastructure maturity and monitoring to support them.

---

## Monitoring Basics

Deploying without monitoring is deploying blind. At minimum:

- **Structured logging** -- JSON format in production. Structured logs are searchable and parseable; unstructured logs are not.
- **Error tracking** -- a service like Sentry or equivalent that captures exceptions with context (stack trace, request data, user).
- **Key metrics** -- response time (p50, p95, p99), error rate, throughput. These three tell you if the system is healthy.
- **Alert on anomalies** -- alert when error rate spikes above baseline, not when it crosses a static threshold. Static thresholds cause alert fatigue (too many false positives during low traffic) or missed incidents (threshold too high).

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Deploy from local machine | Unreproducible, no audit trail, "works on my machine" | Always deploy through CI/CD pipeline |
| No rollback plan | Stuck with broken deployment, extended downtime | Automated rollback on health check failure |
| Migrations during deployment | Race conditions, long locks, partial state | Run migrations as a separate pipeline step |
| SSH into production to fix things | No audit trail, bypasses review, unreproducible | Fix in code, push through pipeline |
| Environment-specific code branches | Merge conflicts, config drift, untestable differences | One codebase, environment variables for config |
| `latest` tag in production | Unpredictable, unreproducible builds | Pin every image and dependency version |

---

## See Also

- [security-review](../security-review/SKILL.md) -- infrastructure security checklist, secrets management
- [logging-standards](../logging-standards/SKILL.md) -- structured logging patterns for production
