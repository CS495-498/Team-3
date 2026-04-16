# System Overview

## Architecture summary

The application is a Next.js portal backed by two main systems:

- Contentstack for managed content
- Supabase for authentication, application data, storage, and operational telemetry

### Request flow

1. A user signs in through Supabase Auth.
2. Next.js middleware refreshes the session and checks route access.
3. The frontend loads content from:
   - Contentstack for portal-managed content
   - Supabase-backed API routes for user and collaboration features
4. Certain UI actions write back to:
   - Contentstack through server API routes
   - Supabase tables and storage

---

## Main content boundaries

### Contentstack

Contentstack is the source of truth for:

- header/navigation
- homepage content
- alerts
- bulletin board content
- demo website library
- demo instruction library
- video library

### Supabase

Supabase is the source of truth for:

- user authentication
- user profiles and roles
- personas
- feature requests
- comments and votes
- bookmarks
- logs and metrics
- uploaded avatars
- feature request attachments

---

## Security model

- Authentication uses Supabase session cookies.
- Authorization is enforced in application code using `profiles.role`.
- Admin route access is checked in middleware.
- Additional ownership checks are used for some edit/delete actions.

See [RBAC-model.md](/Users/charles/Documents/Team-3/Docs/RBAC-model.md) for the complete access model.

---

## Operational dependencies

The system depends on:

- a working Supabase project with the expected schema
- a working Contentstack stack with the expected content models
- environment variables for both services
- storage buckets for avatars and feature uploads
- scheduled jobs for metrics aggregation and log cleanup

---

## Ownership recommendation

The new company should assign clear owners for:

- application hosting
- Supabase administration
- Contentstack administration
- access control and user admin
- production monitoring and support

