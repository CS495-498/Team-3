# Contentstack Portal

[![CI](https://github.com/CS495-Fall2025/Team-3/actions/workflows/ci.yml/badge.svg)](https://github.com/CS495-Fall2025/Team-3/actions/workflows/ci.yml)

An internal portal for Contentstack teams and partners to manage content, collaborate on feature requests, and administer the platform. Built with Next.js 15 and Supabase, using Contentstack as the CMS backend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [User Roles & Permissions](#user-roles--permissions)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)

---

## Features

- **Dashboard** — Homepage with live alerts, expiring notifications, and a rich-text bulletin board
- **Feature Requests** — Submit, vote on, comment on, and track feature requests with file attachments and status tracking
- **Video Library** — Browse and manage videos from YouTube, Vimeo, or direct uploads with auto-generated thumbnails
- **Demo Websites** — Upload and manage demo website content backed by Contentstack
- **Demo Instructions** — Publish and view step-by-step demo guides
- **Bookmarks** — Save and quickly access videos, demo websites, and instructions
- **Admin Panel**
  - User management (view, edit roles, delete users)
  - Partner domain whitelisting/blacklisting for signup control
  - System logs dashboard with filtering and performance metrics
  - Analytics dashboard with API latency, user activity, and health checks
- **User Profiles & Personas** — Manage your profile and create alternate personas for content creation
- **Role-Based Access Control** — Three-tier permission system (Partner → Contentstack → Admin)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS 4, Radix UI, Headless UI, Framer Motion |
| Rich Text Editor | TipTap |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| CMS | Contentstack (delivery, management, live preview, personalization) |
| Data Visualization | Recharts |
| Testing | Mocha, Chai, Sinon, c8 |
| CI/CD | GitHub Actions |

---

## Prerequisites

- **Node.js** v20 or higher
- **npm**
- A **Supabase** project with the required tables, storage buckets, and RLS policies
- A **Contentstack** stack configured with the required content types (alerts, bulletin board, videos, demo websites, demo instructions)

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/CS495-Fall2025/Team-3.git
   cd Team-3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root and populate it with the required environment variables (see [Environment Variables](#environment-variables) below).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** This application requires an active Supabase project and Contentstack stack. Setting up those external services is outside the scope of this guide.

---

## Environment Variables

Create a `.env.local` file at the project root with the following variables:

### Supabase

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose to client) |

### Contentstack

| Variable | Description |
|---|---|
| `CONTENTSTACK_API_KEY` | Contentstack stack API key |
| `CONTENTSTACK_DELIVERY_TOKEN` | Delivery token for fetching published content |
| `CONTENTSTACK_ENVIRONMENT` | Contentstack environment (e.g. `production`) |
| `CONTENTSTACK_PREVIEW_TOKEN` | Preview token for draft content |
| `CONTENTSTACK_MANAGEMENT_TOKEN` | Management token for creating/updating entries |
| `CONTENTSTACK_REGION` | Contentstack region (e.g. `NA`) |
| `CONTENTSTACK_BRANCH` | Contentstack branch (default: `main`) |
| `CONTENTSTACK_PERSONALIZE_PROJECT_UID` | Personalization project UID |
| `CONTENTSTACK_PERSONALIZE_EDGE_API_URL` | Personalization edge API URL |

### Application

| Variable | Description |
|---|---|
| `LOG_INGEST_SECRET` | Secret token used to authenticate internal log ingestion requests |
| `LYTICS_TAG` | Analytics tag for Lytics integration |

### Testing Only (CI)

These are only required when running integration tests. In CI they are provided via GitHub Secrets.

| Variable | Description |
|---|---|
| `TEST_BASE_URL` | Base URL of the running app for integration tests |
| `TEST_PARTNER_EMAIL` | Email of a test user with Partner role |
| `TEST_CONTENTSTACK_EMAIL` | Email of a test user with Contentstack role |
| `TEST_ADMIN_EMAIL` | Email of a test user with Admin role |
| `TEST_USER_PASSWORD` | Shared password for all test users |
| `TEST_HOMEPAGE_ENTRY_UID` | Contentstack entry UID for the homepage content |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run unit tests with code coverage report |
| `npm run test:integration` | Start a dev server on port 3005 and run integration tests against it |

---

## Project Structure

The source code lives in `src/` and is split into three main areas: **pages**, **API routes**, and **shared code**.

### Pages (`src/app/`)

All pages that require login are grouped under `(with-sidebar)/`, which applies the shared sidebar layout automatically.

| Path | What it renders |
|---|---|
| `login/` | Login, signup, and password reset |
| `(with-sidebar)/` | All authenticated pages (sidebar always visible) |
| `(with-sidebar)/page.js` | Dashboard — alerts and bulletin board |
| `(with-sidebar)/feature-requests/` | Feature request list, detail, and submission |
| `(with-sidebar)/videos/` | Video library browser |
| `(with-sidebar)/demo-websites/` | Demo website management |
| `(with-sidebar)/demo-instructions/` | Demo instruction guides |
| `(with-sidebar)/account/` | User profile and settings |
| `(with-sidebar)/admin/usermanagement/` | Edit user roles and delete users |
| `(with-sidebar)/admin/partnermanagement/` | Manage partner email domain rules |
| `(with-sidebar)/admin/logs/` | Application log viewer |
| `(with-sidebar)/admin/metrics/` | API latency, user activity, and health charts |

### API Routes (`src/app/api/`)

Each folder is a REST endpoint. All routes enforce authentication and role-based permissions server-side.

| Route | Purpose |
|---|---|
| `auth/` | Login, signup, logout, password reset |
| `profiles/` | Read and update user profiles |
| `personas/` | Create, switch, and manage personas |
| `feature-requests/` | CRUD, votes, comments, and file uploads |
| `bookmarks/` | Save and remove bookmarks |
| `partner-domains/` | Whitelist/blacklist email domains for signup |
| `logs/` | Ingest and retrieve application logs |
| `metrics/` | API performance and user activity metrics |
| `update-alerts-in-cs/` | Create and delete homepage alerts in Contentstack |
| `update-bulletin-board/` | Update the bulletin board entry in Contentstack |
| `update-video-library-in-cs/` | Add, update, and delete videos in Contentstack |
| `update-demo-web-in-cs/` | Manage demo website entries in Contentstack |
| `demo-instructions/` | Fetch and update demo instruction content |

### Shared Code (`src/`)

| Path | Purpose |
|---|---|
| `middleware.js` | Runs on every request — refreshes session, logs traffic, enforces RBAC |
| `components/` | Shared React components; `components/ui/` holds Radix UI primitives |
| `config/permissions.js` | Permission name constants |
| `config/rolePermissions.js` | Maps each role to its allowed permissions |
| `context/UserContext.jsx` | Provides current user and auth state to the component tree |
| `context/RoleContext.jsx` | Provides current user role |
| `hooks/use-infinite-scroll.js` | Infinite scroll / pagination hook |
| `lib/cstack.js` | Contentstack SDK setup and content fetching helpers |
| `utils/Supabase/` | Supabase client instances (browser, server, middleware) |
| `utils/hasPermission.js` | Checks whether a role has a given permission |
| `utils/logger.js` | Logging utility used across API routes |
| `utils/withLogging.js` | Wraps API route handlers to automatically log requests |

### Other Top-Level Directories

| Path | Purpose |
|---|---|
| `test/rbac/` | Unit tests for role-based access control logic |
| `test/api/` | Unit tests for API route handlers |
| `test/integration/` | End-to-end integration tests (run against a live dev server) |
| `.github/workflows/ci.yml` | CI pipeline — runs unit and integration tests on every PR |

---

## User Roles & Permissions

The app uses a three-tier role system. Each role inherits all permissions from the tier below it.

| Permission | Partner | Contentstack | Admin |
|---|:---:|:---:|:---:|
| View content | ✓ | ✓ | ✓ |
| Comment and vote on feature requests | ✓ | ✓ | ✓ |
| Create and manage own feature requests | | ✓ | ✓ |
| Upload demo websites | | ✓ | ✓ |
| Upload and manage video library | | ✓ | ✓ |
| Upload assets to Contentstack | | ✓ | ✓ |
| Publish demo instructions | | ✓ | ✓ |
| Use personas | | | ✓ |
| Manage all feature requests and comments | | | ✓ |
| Create and manage homepage alerts | | | ✓ |
| Manage bulletin board | | | ✓ |
| Manage users (roles, deletion) | | | ✓ |
| Manage partner signup domains | | | ✓ |
| View application logs | | | ✓ |
| View analytics and metrics | | | ✓ |

New users are assigned the **Partner** role by default. Admins can promote users to Contentstack or Admin roles via the user management panel.

---

## Architecture Overview

**Request lifecycle:** Every request passes through `src/middleware.js`, which refreshes the Supabase session and logs the request metadata to the `logs` table before the route handler runs.

**API authorization:** Protected API routes use `requireAuthWithPermission(permission)` to validate the user's session and check their role against the permission required for the operation. Unauthenticated requests receive a `401`; insufficient permissions receive a `403`.

**Data sources:** User and feature request data lives in **Supabase** (PostgreSQL). Content displayed on the dashboard — alerts, bulletin board, videos, demo websites, and demo instructions — is fetched from and written back to a **Contentstack** stack via the delivery and management APIs.

**Observability:** All requests are logged to a `logs` Supabase table with endpoint, status code, processing time, and user ID. Logs are aggregated nightly into `daily_api_metrics` and `daily_user_metrics` tables, which power the admin metrics dashboard.

**Client state:** User profile and role data is fetched from `/api/profiles/me` on first load and cached in `sessionStorage` to minimize repeated calls across page navigations.

