# Monitoring and Operations Guide

## Purpose

This document explains how the system is monitored, what operational signals exist in the current application, and how administrators should interpret them.

---

## Current monitoring sources

The current application has built-in operational visibility through:

- structured application logs stored in Supabase
- metrics derived from those logs and shown in the admin metrics page
- admin UI pages for logs and metrics

The repository does not include a separate third-party alerting configuration file. If the client uses external alerting, those alert rules should be documented alongside this file after setup.

---

## Where to look during an incident

### Logs

Application logs are available in the admin logs page and via the logs API.

Relevant paths:

- admin page: `/admin/logs`
- API: `/api/logs/dashboard`

Logs include:

- timestamp
- level
- endpoint
- status code
- request method
- processing time
- user identifier when available
- request metadata such as user agent and referer

### Metrics

Metrics are available in the admin metrics page and related metrics APIs.

Relevant paths:

- admin page: `/admin/metrics`
- API: `/api/metrics/api-metrics`
- API: `/api/metrics/user-metrics`

Current metrics views include:

- average hourly request rate
- error percentage
- average latency by endpoint
- user CRUD activity summary

---

## How logging works

Logging is implemented in two places:

- page navigation and middleware events
- API route wrappers through `withLogging`

Logs are written to the `logs` table in Supabase.

The application uses:

- `LOG_INGEST_SECRET` to authorize internal log ingestion requests
- `SUPABASE_SERVICE_ROLE_KEY` to write logs to Supabase

If either of these values is missing or invalid, logs may stop appearing.

---

## Metrics data source

Metrics are derived from the `logs` table and aggregated into:

- `daily_api_metrics`
- `daily_user_metrics`

Important caveat:

Despite the names, these tables are currently hour-bucketed snapshots, not true daily cumulative tables. See [data-model.md](/Users/charles/Documents/Team-3/Docs/data-model.md).

---

## Interpreting key indicators

### Error rate

What it means:

- percentage of requests returning error responses

What abnormal behavior may indicate:

- failed deployment
- missing or invalid environment variables
- Supabase outage or policy issue
- Contentstack outage or schema mismatch

### Latency

What it means:

- average response time by endpoint

What abnormal behavior may indicate:

- slow upstream dependency
- excessive query cost
- storage or network issues
- provider incident

### Request rate

What it means:

- how much traffic the system is handling over time

What abnormal behavior may indicate:

- traffic spike
- bot or crawler activity
- client-side retry loops
- a drop to zero may indicate the app is unavailable or unused

### User CRUD activity

What it means:

- aggregated counts of user requests over the selected period

What abnormal behavior may indicate:

- misuse of admin features
- repeated failing client interactions
- unexpected automated traffic

---

## Recommended alert concepts

The codebase does not currently define a managed alerting platform configuration in version control, but the client should create alerts for at least:

- service unavailable
- high error rate
- high latency
- sudden drop in request rate
- log ingestion failure
- failed Contentstack write operations

Each alert should be linked to a runbook in [runbooks.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/runbooks.md).

---

## What “normal” looks like

The client should establish a normal baseline after observing production usage for several days.

At minimum, record:

- usual request rate range
- normal latency range by major endpoint
- expected error rate
- expected peak usage windows

Without a baseline, alerts are harder to tune and more likely to create noise.

---

## Monitoring checklist after deployment

After each release, verify:

- logs continue to appear in `/admin/logs`
- metrics page loads successfully
- no sudden spike in 4xx or 5xx responses
- feature request and content APIs still respond normally
- recent release did not break Contentstack reads or writes

---

## Access requirements

Only users with the correct admin permissions can access monitoring pages.

Relevant permissions:

- `VIEW_LOGS`
- `VIEW_METRICS`

These are currently assigned to the `admin` role.

---

## Related documents

- [runbooks.md](/Users/charles/Documents/Team-3/Docs/ClientHandover/runbooks.md)
- [RBAC-model.md](/Users/charles/Documents/Team-3/Docs/RBAC-model.md)
- [data-model.md](/Users/charles/Documents/Team-3/Docs/data-model.md)

