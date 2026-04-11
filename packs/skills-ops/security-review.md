---
skill: security-review
scope: universal
profile: standard, full
tags: [security, review, owasp, checklist]
---

# Skill: Security Review

Structured security review process based on OWASP Top 10. Run this before merging any change that touches trust boundaries.

---

## When to Trigger

Not every PR needs a security review. Trigger one when the change involves:

| Trigger | Why It Matters |
|---------|----------------|
| New API endpoint | New attack surface exposed to the network |
| Auth/authz changes | Broken access control is OWASP #1 |
| User input handling | Injection attacks (OWASP #3) |
| File upload/download | Path traversal, malware upload, resource exhaustion |
| Database queries | SQL injection, data exposure |
| Third-party integrations | Supply chain risk, data leakage to external systems |
| Environment variable usage | Secret exposure, misconfiguration |

## Process

### 1. Run Automated Checks First

Automated checks catch the obvious issues and free up manual review for logic problems.

```bash
# Scan for hardcoded secrets (patterns: password=, api_key=, token=, secret=)
rg -i '(password|api_key|secret|token)\s*=' --glob '!*.lock' --glob '!*.md'

# Check for dangerous SQL patterns (string interpolation in queries)
rg 'f".*SELECT|f".*INSERT|f".*UPDATE|f".*DELETE|\.format\(.*SELECT' --glob '*.py'

# Dependency vulnerability audit
uv audit  # or: npm audit / pip-audit

# Check .gitignore includes .env
rg '^\.env' .gitignore
```

### 2. Manual Review Against Checklist

Work through each category below. Check every item that applies to the change.

### 3. Document Findings

Use severity levels for each finding:

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Exploitable now, data breach risk | Block merge, fix immediately |
| **High** | Exploitable with some effort | Block merge, fix before release |
| **Medium** | Defense-in-depth gap | Fix within sprint |
| **Low** | Best practice deviation | Track, fix when convenient |

### 4. Resolve Before Merge

No `TODO: fix security issue` comments in production code. If a finding cannot be fixed immediately, document the accepted risk with a ticket reference and compensating controls.

---

## Checklist

### Input Validation

Why: Unvalidated input is the root cause of injection, XSS, and path traversal attacks.

- [ ] All user input validated at the boundary (API layer), not deep in business logic
- [ ] SQL queries use parameterized statements only -- never string interpolation
- [ ] HTML output is encoded to prevent XSS (use framework auto-escaping)
- [ ] File paths are validated against a whitelist or resolved to prevent traversal (`../`)
- [ ] Shell commands never include user input -- if unavoidable, use `shlex.quote()`
- [ ] Request size limits enforced (body, file upload, query string length)

### Authentication and Authorization

Why: Broken access control has been OWASP #1 since 2021 because it's easy to get wrong and catastrophic when exploited.

- [ ] Passwords hashed with bcrypt or argon2 (never MD5, SHA1, or plain SHA256)
- [ ] Sessions use secure cookies (`HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`)
- [ ] Session expiry and rotation on privilege change (login, role change)
- [ ] Every protected endpoint has server-side permission checks (RBAC or equivalent)
- [ ] Authorization logic lives on the server -- frontend checks are UX only, not security
- [ ] Failed auth attempts are rate-limited to prevent brute force
- [ ] JWT tokens have reasonable expiry and are validated server-side

### Secrets Management

Why: A single leaked credential can compromise the entire system. Secrets in source control are effectively public.

- [ ] No hardcoded credentials, API keys, or tokens in source code
- [ ] All secrets loaded from environment variables or a secrets manager
- [ ] `.env` files are listed in `.gitignore`
- [ ] API keys are scoped to minimum required permissions
- [ ] Secrets are rotatable without code deployment
- [ ] No secrets logged or included in error responses

### Data Protection

Why: Data breaches are expensive (legal, reputational) and often caused by over-collection or careless logging.

- [ ] PII is minimized -- only collect what's needed, delete when no longer required
- [ ] Sensitive data encrypted at rest (database-level or field-level encryption)
- [ ] All external communication over HTTPS/TLS
- [ ] Log output does not include passwords, tokens, PII, or full request bodies
- [ ] Error messages returned to users do not leak stack traces or internal details
- [ ] Database backups are encrypted and access-controlled

### Dependencies

Why: You inherit every vulnerability in your dependency tree. Supply chain attacks are increasing.

- [ ] Dependencies scanned for known vulnerabilities (`uv audit`, `npm audit`)
- [ ] Dependencies pinned to specific versions (lock files committed)
- [ ] No unnecessary dependencies -- fewer deps means smaller attack surface
- [ ] Third-party packages reviewed for excessive permissions/scope

### Infrastructure

Why: Misconfigured infrastructure bypasses all application-level security.

- [ ] CORS allows specific origins only -- no wildcard (`*`) in production
- [ ] Rate limiting on all public-facing endpoints
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers set: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`
- [ ] File uploads stored outside the web root with randomized names
- [ ] Health/debug endpoints not exposed in production

---

## Common Grep Patterns for Quick Scanning

```bash
# Hardcoded secrets
rg -i '(password|secret|api.?key|token|credential)\s*=\s*["\x27][^"\x27]+'

# Dangerous eval/exec
rg '\b(eval|exec|subprocess\.call|os\.system)\b' --glob '*.py'

# Unparameterized SQL
rg '(execute|query)\(.*[fF]"|\.format\(' --glob '*.py'

# Permissive CORS
rg 'allow_origins.*\*|Access-Control-Allow-Origin.*\*'
```

---

## See Also

- [multi-perspective-analysis](multi-perspective-analysis.md) -- use security as one perspective in broader reviews
