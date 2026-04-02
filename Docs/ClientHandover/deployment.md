# Deployment Guide

## Purpose

This document explains how to build, configure, deploy, verify, and roll back the application. It is intended for developers, administrators, and client engineers responsible for running the system.

---

## Deployment model

The application is a Next.js web app with server-side API routes. It depends on:

- Node-compatible application hosting
- a Supabase project
- a Contentstack stack and environment
- environment variables configured in the hosting platform

The repository is compatible with platforms such as Vercel. If another hosting provider is used, it must support:

- Next.js App Router
- middleware
- server-side environment variables
- file uploads up to 25 MB

---

## Environments to maintain

At minimum, the client should maintain:

- development
- production

Recommended:

- development
- staging or test
- production

Each environment should have its own:

- environment variables
- deployment target
- Supabase environment or controlled Supabase data strategy
- Contentstack environment or branch strategy

---

## Required environment variables

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Contentstack

- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_DELIVERY_TOKEN`
- `CONTENTSTACK_MANAGEMENT_TOKEN`
- `CONTENTSTACK_ENVIRONMENT`
- `CONTENTSTACK_PREVIEW_TOKEN`

### Additional configuration referenced by code

- `CONTENTSTACK_REGION`
- `CONTENTSTACK_BRANCH`
- `CONTENTSTACK_PERSONALIZATION`
- `CONTENTSTACK_PERSONALIZE_PROJECT_UID`
- `CONTENTSTACK_PERSONALIZE_EDGE_API_URL`
- `LYTICS_TAG`
- `LOG_INGEST_SECRET`

### Notes

- `SUPABASE_SERVICE_ROLE_KEY`, `CONTENTSTACK_MANAGEMENT_TOKEN`, and `LOG_INGEST_SECRET` must remain server-only.
- `NEXT_PUBLIC_*` values are client-visible.
- Contentstack values placed in `next.config.mjs` should be treated as client-exposed configuration.

---

## Local setup

### Install dependencies

```bash
npm install
```

### Start local development

```bash
npm run dev
```

### Local verification

After starting the app, verify:

- login page loads
- authenticated navigation loads
- homepage content appears
- feature requests page loads
- admin pages load for an admin user

---

## Build and release commands

### Development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Production start

```bash
npm run start
```

### Lint

```bash
npx eslint .
```

### Unit tests

```bash
npm run test:unit
```

### Integration tests

```bash
npm run test:integration
```

Integration tests require a working environment and valid service credentials.

---

## Deployment checklist

Before deploying a new version:

1. Pull the intended branch or release commit.
2. Confirm environment variables are present in the target environment.
3. Run lint and tests as appropriate.
4. Build the app successfully.
5. Review any Contentstack schema changes and Supabase schema changes included in the release.

After deployment:

1. Open the login page.
2. Sign in with a valid account.
3. Verify homepage, demo websites, videos, and feature requests load.
4. Verify admin pages load for an admin account.
5. Verify logs are being recorded.
6. Verify no unexpected increase in error rate or latency appears in metrics.

---

## Production verification checklist

The minimum smoke test after release should include:

- `GET /login`
- successful authentication
- homepage render
- feature requests API response
- Contentstack-backed page render
- one admin page render

Recommended additional checks:

- create or edit a feature request
- load logs page
- load metrics page
- upload an avatar or feature request attachment

---

## Rollback procedure

If a deployment causes regressions:

1. Identify the last known good release.
2. Re-deploy that version through the hosting provider.
3. Verify the application loads normally.
4. Confirm error rate and latency return to normal.
5. Investigate whether the failure was caused by:
   - code changes
   - environment variable changes
   - Supabase schema changes
   - Contentstack model/content changes

### Rollback caution

If the failing deployment included database or content-model changes, rolling back code alone may not fully restore compatibility. In those cases, review:

- Supabase schema migrations
- RLS policy changes
- Contentstack content model changes

---

## Deploying content and config changes

Some issues in production may be caused by content or platform configuration, not application code.

### Contentstack changes

Changes to:

- content models
- entry fields
- references
- environment settings

can break the frontend. Treat these changes like production changes and validate them before publishing.

### Supabase changes

Changes to:

- tables
- views
- RLS policies
- storage buckets
- RPCs

can also break the application immediately.

---

## Restart guidance

The exact restart method depends on the hosting provider.

Operationally, “restart the service” means re-running the deployed application instance using the hosting provider’s restart or redeploy action.

If using Vercel, the normal recovery action is:

- redeploy the last known good build

If using a custom Node host, the recovery action may be:

- restart the Node process or service manager

Document the exact platform-specific restart steps wherever the final hosting provider stores operational procedures.

---

## Secrets management guidance

Secrets should not be committed to the repository.

Store them in:

- hosting platform environment variable settings
- CI/CD secret storage
- a formal secrets manager if available

When personnel changes occur:

- rotate Contentstack management tokens
- rotate Supabase service role keys if required by policy
- rotate internal logging secrets

---

## Related documents

- [README.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/README.md)
- [monitoring.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/monitoring.md)
- [runbooks.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/runbooks.md)
- [testing.md](/Users/charles/Documents/Team-3/Docs/testing.md)

