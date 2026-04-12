# Data Model Documentation

## Overview

This database supports four main concerns in the application:

1. **Identity and access**
   - `auth.users` is the canonical authenticated user record.
   - `public.profiles` stores application-level user data and roles.
   - `public.personas` stores optional alternate identities a user can switch into.

2. **Content interaction**
   - Core content entities such as demo websites, demo instructions, and videos are managed outside this schema, primarily through Contentstack.
   - `public.bookmarks` stores user bookmarks for those external resources.

3. **Feature request workflow**
   - Product feedback is modeled with:
     - `public.feature_requests`
     - `public.feature_request_comments`
     - `public.votes`

4. **Observability and reporting**
   - Raw request and application logs are stored in `public.logs`.
   - Aggregated reporting tables are:
     - `public.daily_api_metrics`
     - `public.daily_user_metrics`

---

## Relationship summary

```text
auth.users
   │
   └── 1:1 public.profiles
            │
            ├── 1:N public.personas
            ├── 1:N public.feature_requests
            │        └── 1:N public.feature_request_comments
            └── N:M public.feature_requests through public.votes

auth.users
   └── 1:N public.bookmarks

public.logs
   ├── aggregated into public.daily_api_metrics
   └── aggregated into public.daily_user_metrics
```

---

## Identity model

### `auth.users`

Supabase Auth owns the canonical authenticated user record. This table is not defined in the shared SQL, but it is the source of truth for authentication.

### `public.profiles`

Application-facing user record for each authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. Also FK to `auth.users(id)`. |
| `updated_at` | `timestamptz` | Last profile update timestamp. |
| `username` | `text` | Unique. Must be at least 3 characters. |
| `full_name` | `text` | Display name. |
| `avatar_url` | `text` | Stored avatar path. |
| `website` | `text` | Optional profile website. |
| `active_persona_id` | `uuid` | Optional FK to `public.personas(id)`. |
| `role` | `user_role` | App role. Defaults to `partner`. |

#### Notes

- This is the main table used for app-level authorization and profile display.
- The application reads role information from `profiles`.
- The uploaded code currently uses these roles:
  - `partner`
  - `contentstack`
  - `admin`
- Avatar files are stored in the `avatars` Supabase Storage bucket.
- The app also references a `public_profiles` view for safe public profile reads.

### `public.personas`

Optional alternate identities owned by a profile.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `owner_id` | `uuid` | FK to `profiles(id)`. |
| `full_name` | `text` | Required persona display name. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `avatar_url` | `text` | Persona avatar path. |
| `username` | `text` | Optional persona username. |

#### Notes

- A profile can own many personas.
- `profiles.active_persona_id` points to the currently active persona.
- Persona creation, switching, and deletion are gated by the `use_personas` permission.
- Persona avatars also use the `avatars` bucket.
- When a persona is deleted, the app clears `profiles.active_persona_id` if that persona was active.

---

## Bookmarks and external content

### `public.bookmarks`

Stores a user’s saved content items.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | FK to `auth.users(id)`. |
| `resource_type` | `text` | One of `demo_website`, `demo_instruction`, `video`. |
| `resource_id` | `text` | External content identifier. |
| `resource_title` | `text` | Denormalized display title. |
| `resource_description` | `text` | Denormalized description. |
| `resource_url` | `text` | Denormalized URL. |
| `resource_thumbnail` | `text` | Denormalized thumbnail reference. |
| `metadata` | `jsonb` | Optional additional resource metadata. |
| `created_at` | `timestamptz` | Bookmark creation timestamp. |

#### Notes

- This table does **not** reference another local content table.
- `resource_id` should be treated as an external content key.
- The application currently bookmarks three content classes:
  - demo websites
  - demo instructions
  - videos
- Display fields are denormalized so bookmarked items can still render without re-querying the external content source.
- The app logic assumes a user should only have one bookmark per resource, but the schema does **not** currently enforce that with a unique constraint.

#### Recommended improvement

Add a unique index on:

```sql
(user_id, resource_type, resource_id)
```

This would align the schema with current application behavior.

---

## Feature request workflow

### `public.feature_requests`

Stores submitted feature requests.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `content` | `text` | Request body. |
| `title` | `text` | Request title. |
| `user_id` | `uuid` | FK to `profiles(id)`. |
| `updated_at` | `timestamptz` | Last updated timestamp. |
| `number_of_votes` | `bigint` | Defaults to `0`. |
| `status` | `feature_status` | Defaults to `open`. |
| `file_url` | `text` | Optional uploaded file path. |

#### Notes

- Feature requests are authored by users in `profiles`, not directly by `auth.users`.
- The app code references at least these statuses:
  - `open`
  - `closed`
  - `completed`
- Attachments are stored in the `feature-uploads` Supabase Storage bucket.
- `file_url` stores the storage path; the API generates signed URLs when returning records.

#### Important implementation detail

Although the table includes `number_of_votes`, the application currently recomputes net vote totals from the `votes` table when listing requests and when processing votes.

As implemented today:

- `votes` is the authoritative source of vote state.
- `feature_requests.number_of_votes` should be treated as denormalized or legacy unless synchronization logic is added.

### `public.feature_request_comments`

Stores comments on feature requests.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last updated timestamp. |
| `content` | `text` | Required comment content. |
| `feature_request_id` | `uuid` | FK to `feature_requests(id)`. |
| `user_id` | `uuid` | FK to `profiles(id)`. |

#### Notes

- One feature request can have many comments.
- Comments are authored by `profiles` users.
- The application supports create, read, update, and delete operations on comments.

### `public.votes`

Stores a user’s vote on a feature request.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | FK to `profiles(id)`. |
| `req_id` | `uuid` | FK to `feature_requests(id)`. |
| `Upvoted` | `boolean` | `true` = upvote, `false` = downvote. |

#### Primary key

Composite primary key:

```sql
(user_id, req_id)
```

#### Notes

- This table implements the many-to-many relationship between users and feature requests.
- The app uses upsert-style vote handling so each user has exactly one current vote per request.
- Net score is calculated as:

```text
upvotes - downvotes
```

#### Schema concern

Both `user_id` and `req_id` have `gen_random_uuid()` defaults. For a relational join table, those defaults are misleading and should not be relied on. The application correctly supplies real IDs.

---

## Logging and metrics

### `public.logs`

Stores raw application and request logs.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `timestamp` | `timestamp` | Defaults to current timestamp. |
| `level` | `varchar` | `info`, `warning`, or `error`. |
| `endpoint` | `varchar` | Request path or endpoint. |
| `status_code` | `integer` | HTTP status code. |
| `message` | `text` | Log message. |
| `user_id` | `varchar` | Optional user identifier from headers. |
| `metadata` | `jsonb` | Additional request metadata. |

#### Metadata fields observed in code

The logging layer currently writes fields such as:

- `method`
- `processing_time_ms`
- `user_agent`
- `referer`
- `error_stack`

#### Notes

- Logs are written by middleware and API wrapper utilities.
- `user_id` is stored as `varchar`, not `uuid`, because it is captured from request headers.
- There is no FK from logs back to `profiles` or `auth.users`.
- Endpoints are normalized during aggregation by replacing UUID path segments with `/:id`.

### `public.daily_user_metrics`

Stores aggregated request metrics by user and endpoint.

| Column | Type | Notes |
|---|---|---|
| `date` | `timestamptz` | Bucket timestamp. |
| `user_id` | `varchar` | User identifier from logs. |
| `avg_request_rate` | `real` | Requests per minute over the last 5-minute window. |
| `endpoint` | `varchar` | Normalized endpoint. |
| `post_count` | `double precision` | POST count. |
| `get_count` | `double precision` | GET count. |
| `put_count` | `double precision` | PUT/PATCH count. |
| `delete_count` | `double precision` | DELETE count. |

#### Primary key

```sql
(date, user_id, endpoint)
```

#### Notes

- Populated every 5 minutes from `logs`.
- Endpoint paths are normalized by converting UUID segments to `/:id`.
- The admin metrics API later aggregates these rows by `user_id` across a selected date range.

#### Important grain note

Despite the table name, the current job buckets rows using:

```sql
date_trunc('hour', timestamp)
```

So the actual grain is **hour + user + endpoint**, not day.

### `public.daily_api_metrics`

Stores aggregated endpoint-level operational metrics.

| Column | Type | Notes |
|---|---|---|
| `date` | `timestamptz` | Bucket timestamp. |
| `endpoint` | `varchar` | Normalized endpoint. |
| `avg_request_rate` | `real` | Requests per minute over the aggregation window. |
| `error_rate` | `double precision` | Percentage of requests with `status_code >= 400`. |
| `log_type` | `varchar` | Derived from log level. |
| `post_count` | `numeric` | POST count. |
| `get_count` | `numeric` | GET count. |
| `put_count` | `numeric` | PUT/PATCH count. |
| `delete_count` | `numeric` | DELETE count. |
| `avg_latency` | `real` | Average request latency in milliseconds. |

#### Primary key

```sql
(date, endpoint, log_type)
```

#### Notes

- Populated every 5 minutes from `logs`.
- `log_type` is populated from `logs.level`, so expected values are:
  - `info`
  - `warning`
  - `error`
- The admin metrics API uses this table for reporting request volume, error rate, and latency by endpoint.

#### Important grain note

Like `daily_user_metrics`, this table is also **hourly**, not truly daily.

---

## Signup domain policy

### `public.signup_email_domains`

Stores domain-based signup policy records.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key. |
| `domain` | `text` | Unique email domain. |
| `type` | user-defined enum | Domain classification. |
| `reason` | `text` | Optional explanation. |
| `created_at` | `timestamptz` | Creation timestamp. |
| `updated_at` | `timestamptz` | Last updated timestamp. |
| `active` | `boolean` | Whether the rule is active. |

#### Notes

- This table appears intended for domain-based signup governance.
- It is not referenced in the uploaded application code that was reviewed, so it may be dormant, used elsewhere, or planned for future use.

---

## Scheduled jobs

### `aggregate_user_metrics_every_5_min`

Aggregates the last 5 minutes of `logs` into `daily_user_metrics`.

#### Behavior

- Runs every 5 minutes.
- Filters to logs within the last 5 minutes.
- Ignores rows where `user_id` is null.
- Normalizes endpoints by replacing UUID path segments with `/:id`.
- Writes method counts and average request rate.
- Upserts on:

```sql
(date, user_id, endpoint)
```

#### Important behavior

Because `date` is `date_trunc('hour', timestamp)`, multiple runs within the same hour overwrite the same row rather than accumulating into a full hourly total.

That means each row currently represents the **latest 5-minute slice for that hour bucket**, not a cumulative hourly aggregate.

### `aggregate_api_metrics_every_5_min`

Aggregates the last 5 minutes of `logs` into `daily_api_metrics`.

#### Behavior

- Runs every 5 minutes.
- Groups by:
  - `level`
  - normalized endpoint
  - hour bucket
- Calculates:
  - average request rate
  - error rate
  - average latency
  - CRUD method counts
- Upserts on:

```sql
(date, endpoint, log_type)
```

#### Important behavior

This job has the same overwrite behavior as the user metrics job. It does not accumulate successive 5-minute windows into a true hourly rollup.

### `cleanup-old-logs`

Deletes old rows from `logs`.

#### Behavior

- Runs hourly.
- Deletes up to 10,000 rows older than 7 days.

#### Note

Because the delete is limited to 10,000 rows per run, very high log volume can create cleanup backlog.

---

## External dependencies referenced by the app

The uploaded code references several objects and services beyond the tables shown in the SQL.

### Supabase Auth

- `auth.users`

### Supabase Storage buckets

- `avatars`
- `feature-uploads`

### Additional database objects

- `public_profiles` view
- `admin_get_users` RPC

### External content source

- Contentstack

The database stores user interaction around content, but the underlying content entities are managed externally.

---

## Join guidance

Use these joins consistently:

### User/profile joins

- `profiles.id = auth.users.id`
- Most business-domain tables join through `profiles.id`.

### Feature request joins

- `feature_requests.user_id -> profiles.id`
- `feature_request_comments.feature_request_id -> feature_requests.id`
- `feature_request_comments.user_id -> profiles.id`
- `votes.req_id -> feature_requests.id`
- `votes.user_id -> profiles.id`

### Bookmark joins

- `bookmarks.user_id -> auth.users.id`
- `bookmarks.resource_id` is an external key, not a relational FK.

### Log and metrics joins

- `logs.user_id` and `daily_user_metrics.user_id` are stored as strings.
- Treat them as observational identifiers rather than FK-backed relational keys.

---

## Recommended conventions for contributors

1. Treat `profiles` as the application user table and `auth.users` as the authentication table.
2. Treat `votes` as the source of truth for request score unless vote totals are explicitly synchronized into `feature_requests.number_of_votes`.
3. Treat bookmarks as references to external content, not local content entities.
4. Remember that `daily_*_metrics` are currently hour-bucketed snapshots despite their names.
5. When adding new bookmarkable content types, update both:
   - the `bookmarks.resource_type` check constraint
   - the corresponding app-side constants
6. Be careful with identity consistency: most domain tables use UUID FKs, but logs and metrics use string user identifiers.

---

## Summary

This schema is best understood as:

- **Supabase Auth + Profiles** for identity
- **Personas** for alternate display identities
- **Feature requests / comments / votes** for collaborative product feedback
- **Bookmarks** for saving externally managed content
- **Logs + metrics** for observability and reporting

The most important non-obvious implementation detail is that the so-called `daily` metrics tables are not truly daily aggregates in their current form. They are hour-bucketed rows repeatedly overwritten by 5-minute cron jobs.
