# Risk Log — Contentstack Demo Portal

**Project:** Contentstack Demo Portal  
**Owner:** Team-3  
**Last Updated:** 2025-12-09  

This document tracks identified project risks, their impact, likelihood, mitigation strategies, and current status.  
Each risk is reviewed continuously throughout the project lifecycle.

---

## Risk Scale

| Level | Description |
|------|------------|
| Low | Minimal impact, unlikely to occur |
| Medium | Noticeable impact, possible occurrence |
| High | Severe impact, likely or already observed |

---

## Risk Register

---

### R1 — Contentstack API Latency or Rate Limits

**Description:**  
Frequent requests for demos, videos, and referenced content may introduce latency or exceed Contentstack API rate limits.

**Impact:** High  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Use Contentstack references to fetch related content in a single API request
- Prefer server-side fetching over client-side requests  
- Monitor API usage during development and testing  
- Consider caching or ISR as a future enhancement if scaling becomes necessary  

**Owner:** Backend / Platform  
**Status:** Accepted Risk (caching yet to be implemented)

---

### R2 — Unauthorized Content Access

**Description:**  
Improper role-based checks could allow users to view demos or content not intended for their role (Sales, SE, Partner).

**Impact:** High  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Enforce Supabase Row Level Security (RLS)  
- Perform server-side authorization before fetching content  
- Validate role claims via JWT on every protected route  

**Owner:** Security / Backend  
**Status:** Active Monitoring

---

### R3 — Environment Configuration Errors

**Description:**  
Misconfigured environment variables between local, preview, and production environments could break API calls or expose secrets.

**Impact:** High  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Separate public vs server-only environment variables  
- Use `.env.local` and hosting provider environment settings  
- Validate config at application startup  

**Owner:** DevOps  
**Status:** Mitigated

---

### R4 — Breaking Changes in Content Models

**Description:**  
Changes to Contentstack content models (fields, references, groups) may break rendering logic or API responses.

**Impact:** Medium  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Lock critical content models during development  
- Communicate schema changes across team  
- Use defensive rendering and optional chaining  

**Owner:** Content / Frontend  
**Status:** Active

---

### R5 — Merge Conflicts and Branch Instability

**Description:**  
Multiple contributors working simultaneously may cause merge conflicts or regressions.

**Impact:** Medium  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Follow feature-branch workflow  
- Use GitHub pull requests with review requirements  
- Run CI checks (tests, linting) before merging  

**Owner:** Team Lead  
**Status:** Ongoing

---

### R6 — Insufficient Test Coverage

**Description:**  
Lack of automated tests may allow regressions or silent failures in API routes.

**Impact:** Medium  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Develop Mocha / Chai unit tests for API routes  
- Perform Postman & Newman integration testing  
- Track coverage metrics with `nyc` / `c8`  

**Owner:** QA / Backend  
**Status:** In Progress

---

### R7 — Performance Degradation with Large Content Sets

**Description:**  
Large content libraries (videos, demos, bookmarks) may degrade performance.

**Impact:** Medium  
**Likelihood:** Medium  

**Mitigation Strategy:**  
- Paginate large queries  
- Lazy-load content where possible  
- Index Supabase database queries  

**Owner:** Backend  
**Status:** Planned

---

### R8 — Deployment Failure or Downtime

**Description:**  
Failed deployments or misconfigured builds may cause temporary downtime.

**Impact:** High  
**Likelihood:** Low  

**Mitigation Strategy:**  
- Use staged deployments (preview → production)  
- Validate builds locally before deploy  
- Monitor deployment logs and rollback if needed  

**Owner:** DevOps  
**Status:** Low Risk

---

## Review Notes

- Risks are reviewed weekly and updated as new threats emerge.
- Mitigations are adjusted as system complexity grows.
- High-impact risks are prioritized throughout development.

---
