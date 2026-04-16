# Environment Configuration Handover

## Purpose

This document is the handover reference for the runtime configuration used by the project. It explains:

- what each environment variable is for,
- whether it should be public in the browser or kept server-only,
- where the value is typically managed or retrieved during handover,
- and what should be validated before final transfer.

---

## Implementation Summary

The application relies on three main external systems:

1. **Contentstack** for content delivery, preview, and content management operations.
2. **Supabase** for authentication, database access, storage, and internal operational logging.
3. **Hosting environment variables** for runtime configuration and secret injection.

Important implementation notes:

- Values prefixed with `NEXT_PUBLIC_` are intended to be exposed to browser-side code.
- `SUPABASE_SERVICE_ROLE_KEY`, `CONTENTSTACK_MANAGEMENT_TOKEN`, and `LOG_INGEST_SECRET` must remain **server-only**.
- Some Contentstack values are intentionally exposed through the app configuration because the frontend content SDK uses them directly.

---

## Environment Variable Inventory

### Contentstack

| Variable | Visibility | What it is used for in this project | Where it might be found for handover | Handover note |
|---|---:|---|---|---|
| `CONTENTSTACK_API_KEY` | Browser + server | Identifies the Contentstack stack for content delivery and content management operations. Used by the frontend content SDK and server-side content workflows. | Contentstack stack settings, typically under **Stack Settings / API access / Tokens**. | Required. Transfer with the correct stack access and ownership. |
| `CONTENTSTACK_DELIVERY_TOKEN` | Browser + server | Read-only token used to fetch published content from Contentstack. | Contentstack **Delivery Tokens**. | Required for published content delivery. |
| `CONTENTSTACK_ENVIRONMENT` | Browser + server | Selects the Contentstack publishing environment used by the application. | Contentstack **Environments** settings. | Required. Must match the environment associated with delivery and preview workflows. |
| `CONTENTSTACK_PREVIEW_TOKEN` | Browser + server | Enables preview and live preview content retrieval where preview workflows are active. | Contentstack preview/delivery token settings. | Required if preview remains part of the retained workflow. |
| `CONTENTSTACK_BRANCH` | Browser + server | Selects the Contentstack branch used by the application. | Contentstack branch settings. | Required if the project runs on a non-default branch; otherwise document the default branch clearly. |
| `CONTENTSTACK_MANAGEMENT_TOKEN` | Server-only | Write-capable token used for content creation, updates, publishing, and asset management in server-side routes. | Contentstack **Management Tokens**. | Critical secret. Transfer securely and rotate after handover. |

### Supabase

| Variable | Visibility | What it is used for in this project | Where it might be found for handover | Handover note |
|---|---:|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Base URL for all Supabase browser, SSR, middleware, and service-role client usage. | Supabase **Project Settings > API** or **Connect** screen. | Required. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Public client key used for browser and SSR Supabase access, auth/session handling, and middleware refresh flows. | Supabase **Project Settings > API Keys** or **Connect** screen. | Required. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Elevated Supabase key used for admin operations, privileged data access, and internal service-side actions. | Supabase **Project Settings > API Keys**. | Critical secret. Server-only. Rotate after handover. |

### Internal logging

| Variable | Visibility | What it is used for in this project | Where it might be found for handover | Handover note |
|---|---:|---|---|---|
| `LOG_INGEST_SECRET` | Server-only | Shared secret used to protect the internal log ingestion endpoint. | Hosting provider environment variables or the team’s secure secret store. This is application-specific rather than vendor-generated. | Required if internal request logging remains enabled. Rotate after handover. |

---

## Required runtime inventory

These environment variables should be treated as the active runtime handover set:

- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_DELIVERY_TOKEN`
- `CONTENTSTACK_ENVIRONMENT`
- `CONTENTSTACK_PREVIEW_TOKEN`
- `CONTENTSTACK_BRANCH`
- `CONTENTSTACK_MANAGEMENT_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_INGEST_SECRET`

---

## Recommended source of truth during handover

### 1. Hosting platform environment settings

Use the deployed project’s runtime configuration as the primary inventory of what the app needs in each environment.

Expected locations:

- hosting provider project settings,
- team secret manager / password vault,
- local `.env.local` only as a developer convenience copy, not the canonical handover source.

### 2. Contentstack admin access

The receiving team should receive:

- stack access,
- token management access,
- environment visibility,
- branch visibility,
- and confirmation of which stack, environment, and branch are production.

### 3. Supabase admin access

The receiving team should receive:

- project access,
- API key visibility,
- auth settings access,
- storage access,
- database access,
- and confirmation of any flows that depend on the service role key.

---

## Secure handover procedure

1. **Do not place live secret values inside project documentation.**
2. Transfer all values through a secure vault, password manager, or platform-native ownership transfer.
3. Give the receiving team direct access to the vendor platforms first, then transfer individual secrets where needed.
4. After the receiving team validates access, rotate at minimum:
   - `CONTENTSTACK_MANAGEMENT_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LOG_INGEST_SECRET`
5. Reconfirm that browser-exposed variables are limited to those intentionally safe for frontend use.
6. Redeploy each environment after any key rotation or variable updates.

---

## Validation checklist

Before handover is signed off, confirm:

- the site runs locally with the agreed development environment file,
- the deployed site runs in the target hosting environment,
- Contentstack content loads successfully,
- preview works if it is still part of the retained workflow,
- Contentstack publishing actions work from the intended admin flows,
- Supabase login and session refresh work,
- admin user/profile actions work,
- logs continue to insert successfully,
- and all secrets have been transferred and rotated where required.

---

## Final handover register

| Variable | Dev | Preview/Staging | Production | Owner after handover | Stored in secure vault? | Rotated after transfer? | Notes |
|---|---|---|---|---|---|---|---|
| `CONTENTSTACK_API_KEY` |  |  |  |  |  |  |  |
| `CONTENTSTACK_DELIVERY_TOKEN` |  |  |  |  |  |  |  |
| `CONTENTSTACK_ENVIRONMENT` |  |  |  |  |  |  |  |
| `CONTENTSTACK_PREVIEW_TOKEN` |  |  |  |  |  |  |  |
| `CONTENTSTACK_BRANCH` |  |  |  |  |  |  |  |
| `CONTENTSTACK_MANAGEMENT_TOKEN` |  |  |  |  |  |  | Rotate |
| `NEXT_PUBLIC_SUPABASE_URL` |  |  |  |  |  |  |  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |  |  |  |  |  |  |  |
| `SUPABASE_SERVICE_ROLE_KEY` |  |  |  |  |  |  | Rotate |
| `LOG_INGEST_SECRET` |  |  |  |  |  |  | Rotate |

---

## Bottom-line handover set

The minimum runtime configuration that should be transferred is:

- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_DELIVERY_TOKEN`
- `CONTENTSTACK_ENVIRONMENT`
- `CONTENTSTACK_PREVIEW_TOKEN`
- `CONTENTSTACK_BRANCH`
- `CONTENTSTACK_MANAGEMENT_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_INGEST_SECRET`
