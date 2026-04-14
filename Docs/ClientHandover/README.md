# Client Handover Guide

## Purpose

This document is the operational handoff for the company taking ownership of this website. It explains what the application depends on, what must be configured before launch, how to run it locally and in production, and what ongoing responsibilities the new owner will have after takeover.

This guide is written from the current codebase, not from an ideal future architecture. Where the implementation has important caveats, they are called out explicitly.

---

## What this application is

This repository is a Next.js application that combines:

- Contentstack for most site content and navigation
- Supabase for authentication, user profiles, feature requests, comments, votes, bookmarks, file storage, logs, and metrics
- Role-based access control enforced in application code

At a high level:

- public-facing content inside the authenticated portal is primarily read from Contentstack
- user-generated and administrative data is stored in Supabase
- the application expects both platforms to be configured correctly before it can function

---

## Core systems the new company must own

The website cannot run correctly unless the new company has administrative control over all of the following:

### 1. Source code and hosting

- This repository
- A Git hosting location for the code
- A production hosting target for the Next.js app

The current project is a standard Next.js app and is well suited to Vercel, although another Node-capable hosting platform can also work if it supports:

- Next.js App Router
- server-side environment variables
- middleware
- file upload handling up to 25 MB

### 2. Supabase project

The new company needs a Supabase project that they control, including:

- Auth
- Database
- Storage
- Row-level security and policies
- SQL jobs / scheduled jobs used for metrics cleanup and aggregation

### 3. Contentstack stack/environment

The new company needs control of the Contentstack stack used by the app, including:

- content types
- entries
- environments
- delivery token
- preview token
- management token
- any branch/environment conventions being used

### 4. Operational secrets and environment variables

The app depends on several secrets and service credentials. These must be rotated into the new company’s control before launch.

---

## Functional areas in the site

The current application includes these main areas:

- Dashboard / homepage
  - reads `homepage` content from Contentstack
  - supports alerts and bulletin board editing for authorized users
- Demo websites
  - reads `custom_demos` from Contentstack
  - supports add/edit/delete for authorized users
  - can upload thumbnails to Contentstack
  - can auto-generate screenshots for thumbnails
- Demo instructions
  - reads `demo_instructions` and `demo_instruction` entries from Contentstack
  - supports create/update/delete for authorized users
- Video library
  - reads `video_library` from Contentstack
  - supports add/edit/delete for authorized users
  - supports thumbnail generation/upload
- Feature requests
  - stored in Supabase
  - includes comments, votes, and optional file uploads
- Account management
  - profile editing
  - avatar upload
  - persona management for admins
- Admin pages
  - user management
  - partner domain management
  - logs
  - metrics

---

## Required external dependencies

### Supabase database objects

Based on the current code and schema documentation, the new company must preserve or recreate these important database objects:

- `profiles`
- `personas`
- `feature_requests`
- `feature_request_comments`
- `votes`
- `bookmarks`
- `logs`
- `daily_api_metrics`
- `daily_user_metrics`
- `signup_email_domains`
- `public_profiles` view
- `admin_get_users` RPC

Supporting auth object:

- `auth.users`

### Supabase storage buckets

These buckets are referenced directly by the app:

- `avatars`
- `feature-uploads`

### Contentstack content types referenced by the app

The code currently references these Contentstack content types:

- `header`
- `homepage`
- `custom_demos`
- `video_library`
- `demo_instructions`
- `demo_instruction`
- `faq`
- `site_settings`

These content models, field names, and entry structures must remain compatible with the current frontend code unless the code is updated at the same time.

### Scheduled jobs and maintenance jobs

The schema documentation references these recurring jobs:

- `aggregate_user_metrics_every_5_min`
- `aggregate_api_metrics_every_5_min`
- `cleanup-old-logs`

If the new company recreates the Supabase project from scratch, these jobs must also be recreated or replaced.

---

## Environment variables

The current code references the following environment variables.

### Required for Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Required for Contentstack

- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_DELIVERY_TOKEN`
- `CONTENTSTACK_MANAGEMENT_TOKEN`
- `CONTENTSTACK_ENVIRONMENT`
- `CONTENTSTACK_PREVIEW_TOKEN`

### Optional or environment-specific Contentstack settings

- `CONTENTSTACK_REGION`
- `CONTENTSTACK_BRANCH`
- `CONTENTSTACK_PERSONALIZATION`
- `CONTENTSTACK_PERSONALIZE_PROJECT_UID`
- `CONTENTSTACK_PERSONALIZE_EDGE_API_URL`
- `LYTICS_TAG`

### Required for internal logging

- `LOG_INGEST_SECRET`

### Test-only or integration-test variables

- `TEST_HOMEPAGE_ENTRY_UID`

### Important note

Some Contentstack values are exposed to the browser through `next.config.mjs`. Anything defined there should be treated as client-visible configuration, not a server-only secret.

Do not expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CONTENTSTACK_MANAGEMENT_TOKEN`
- `LOG_INGEST_SECRET`

outside secure server-side environment variable storage.

---

## Roles and access model

The application uses static RBAC defined in code, with role assignments stored on `profiles.role`.

Current roles:

- `partner`
- `contentstack`
- `admin`

Important practical meaning:

- `partner`
  - can view content
  - can comment and vote on feature requests
- `contentstack`
  - can manage content-oriented features such as demo instructions, demo websites, videos, and their own feature requests
- `admin`
  - can manage users, partner domains, logs, metrics, all feature requests, all comments, notifications, and personas

The full matrix is documented in [RBAC-model.md](/Users/charles/Documents/Team-3/Docs/RBAC-model.md).

---

## Signup and user onboarding behavior

This app is not open signup in the usual sense.

It depends on domain governance through the `signup_email_domains` table:

- middleware checks the signed-in user’s email domain
- if the domain is inactive, the user is redirected back to login
- admins can manage allowed/blocked domains from the Partner Management page

This means the new company must decide:

- which partner/customer/internal email domains are allowed
- whether signups should be self-service or centrally managed
- who will administer domain allow/deny policy

Before go-live, verify that at least one admin account exists in Supabase and that its email domain is allowed.

---

## How content is managed

### Contentstack-managed content

Most library-style content comes from Contentstack. The new company must be prepared to manage:

- navigation/header content
- homepage alerts
- homepage bulletin board content
- demo websites
- demo instructions
- videos

The application includes API routes that update and publish Contentstack entries directly from the UI. Those routes depend on a valid `CONTENTSTACK_MANAGEMENT_TOKEN`.

### Supabase-managed content

The following content is stored in Supabase:

- user profiles
- avatars
- personas
- feature requests
- feature request comments
- votes
- bookmarks
- logs and metrics

---

## Production setup checklist

The new company should complete this checklist in order.

### 1. Prepare infrastructure ownership

- Move the repository into the new company’s source control
- Create production and non-production hosting environments
- Create or take ownership of the Supabase project
- Create or take ownership of the Contentstack stack/environment

### 2. Configure Supabase

- Enable Supabase Auth
- Ensure `profiles` rows are created for real users
- Load all required tables, views, RPCs, policies, enums, and jobs
- Create storage buckets:
  - `avatars`
  - `feature-uploads`
- Verify row-level security and policies match application expectations
- Seed at least one admin user
- Seed or configure `signup_email_domains`

### 3. Configure Contentstack

- Recreate or verify the required content types
- Recreate or verify the expected entries for:
  - homepage
  - header
  - demo website library
  - demo instruction library
  - video library
  - site settings
- Generate tokens needed by the application
- Confirm publish targets and environment names match `CONTENTSTACK_ENVIRONMENT`

### 4. Configure environment variables

- Add all required variables to local development
- Add all required variables to production hosting
- Rotate inherited secrets so the new company is the only owner

### 5. Install and validate the app

- run `npm install`
- run `npm run dev`
- verify login
- verify homepage renders
- verify sidebar navigation loads from Contentstack
- verify feature requests load from Supabase
- verify admin pages work for an admin account

### 6. Run quality checks

- run `npm run test:unit`
- run `npm run lint`
- optionally run `npm run test:integration` if a suitable integration environment is available

### 7. Final go-live checks

- verify production callback/login flow
- verify file uploads to Supabase storage
- verify Contentstack write operations from admin/content editors
- verify logs are being recorded
- verify metrics pages have data after traffic exists

---

## Local development setup

### Prerequisites

- Node.js compatible with the project’s Next.js version
- npm
- access to the required Supabase and Contentstack environments

### Basic steps

1. Create a local environment file with the variables listed above.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

### Useful scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run test:integration`

---

## Ongoing responsibilities for the new company

After handoff, the new company will need to actively maintain both content and platform operations.

### Content responsibilities

- maintain Contentstack content models and entries
- manage homepage alerts and bulletin board content
- manage demo websites, instructions, and videos
- monitor for breaking Contentstack schema changes before publishing them

### User administration responsibilities

- create and maintain admin access
- manage user roles
- manage allowed and denied signup domains
- review persona usage if that feature is kept enabled

### Platform responsibilities

- rotate secrets when staff or vendors change
- maintain hosting and deployment settings
- monitor logs and metrics
- maintain Supabase jobs, RLS policies, storage, and backups
- keep dependencies updated
- verify uploads and publishing flows still work after upgrades

### Support responsibilities

- respond to feature request submissions
- moderate comments if needed
- resolve login/signup issues tied to email domain rules
- support content editors using the Contentstack-powered workflows

---

## Known implementation caveats

These are important to understand before the new company takes over.

### 1. The generic README is not an operations guide

The root `README.md` is currently boilerplate and should not be treated as complete deployment documentation.

### 2. Metrics tables are not truly daily

Per [data-model.md](/Users/charles/Documents/Team-3/Docs/data-model.md), the `daily_*_metrics` tables are actually hour-bucketed snapshots overwritten by 5-minute jobs. The new company should review whether that behavior is acceptable.

### 3. Contentstack schema coupling is strong

Several frontend pages assume specific Contentstack content types and field structures. Schema changes in Contentstack can break the app without any code changes in this repository.

### 4. RBAC is code-defined

Permissions are not configured dynamically in the database. If the new company wants different roles or permissions, code changes will be required in:

- [permissions.js](/Users/charles/Documents/Team-3/src/config/permissions.js)
- [rolePermissions.js](/Users/charles/Documents/Team-3/src/config/rolePermissions.js)

### 5. Feature request uploads rely on Supabase storage

If the `feature-uploads` bucket or related policies are missing, feature request attachments will fail.

### 6. Logging depends on an internal secret

If `LOG_INGEST_SECRET` is missing or inconsistent across environments, log ingestion may silently fail.

---

## Recommended first actions after takeover

The safest sequence for the new company is:

1. Stand up a non-production environment under the new company’s control.
2. Recreate or validate all Supabase and Contentstack dependencies there.
3. Rotate all inherited secrets.
4. Verify login, content reads, content publishing, uploads, and admin workflows.
5. Assign named owners for:
   - hosting
   - Supabase
   - Contentstack
   - user administration
   - production support
6. Only then cut over production traffic.

---

## Related documents

- [system-overview.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/system-overview.md)
- [deployment.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/deployment.md)
- [monitoring.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/monitoring.md)
- [runbooks.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/runbooks.md)
- [RBAC-model.md](/Users/charles/Documents/Team-3/Docs/RBAC-model.md)
- [data-model.md](/Users/charles/Documents/Team-3/Docs/data-model.md)
- [testing.md](/Users/charles/Documents/Team-3/Docs/testing.md)
- [details.md](/Users/charles/Documents/Team-3/Docs/api/details.md)
- [openapi.json](/Users/charles/Documents/Team-3/Docs/api/openapi.json)
