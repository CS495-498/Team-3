# Operational Runbooks

## Purpose

These runbooks describe how to respond to common operational problems in the current system.

Each runbook follows the same pattern:

- alert or symptom
- likely causes
- diagnostics
- resolution
- escalation guidance

---

## Runbook: Application unavailable

### Symptom

- users cannot load the site
- login page fails to load
- request rate drops unexpectedly

### Likely causes

- hosting outage
- failed deployment
- server process crash
- severe configuration problem

### Diagnostics

1. Check whether the hosting platform reports the deployment as healthy.
2. Check whether the app can serve the login page.
3. Review recent deployment history.
4. Check recent logs for startup or runtime failures.
5. Confirm required environment variables are still present.

### Resolution

1. If the latest deployment is faulty, redeploy the last known good version.
2. If the hosting platform lost environment configuration, restore the missing values.
3. If the platform instance is unhealthy, restart or redeploy the service.

### Escalation

- escalate to the hosting platform administrator if the provider itself is degraded

---

## Runbook: High error rate

### Symptom

- error percentage rises above the usual baseline
- logs show repeated 4xx or 5xx responses

### Likely causes

- faulty deployment
- invalid environment variables
- Supabase access or RLS issue
- Contentstack outage or content-model mismatch

### Diagnostics

1. Open `/admin/metrics` and confirm the error spike window.
2. Open `/admin/logs` and filter by recent time range.
3. Identify which endpoint or workflow is failing.
4. Review recent code, environment, Supabase, or Contentstack changes.
5. Check whether failures affect all users or only specific roles.

### Resolution

1. Roll back the latest deployment if the spike began immediately after release.
2. Restore missing or incorrect environment variables.
3. Fix Supabase schema or policy issues if access is failing.
4. Revert or correct Contentstack content-model changes if content reads or writes are failing.

### Escalation

- escalate to the Supabase owner for database and policy failures
- escalate to the Contentstack owner for content-model or token failures

---

## Runbook: High latency

### Symptom

- average latency increases on one or more endpoints
- page loads feel significantly slower

### Likely causes

- slow upstream dependency
- slow database query
- storage delay
- unusual traffic spike

### Diagnostics

1. Review `/admin/metrics` for the endpoints with the highest latency.
2. Inspect logs for those endpoints and compare processing times.
3. Determine whether the slow path depends on Supabase, Contentstack, or file storage.
4. Review traffic volume during the affected window.

### Resolution

1. If the issue started after deployment, roll back the change.
2. If a single dependency is slow, confirm provider health and credentials.
3. If load is abnormal, rate-limit or mitigate the traffic source if possible.

### Escalation

- escalate to the platform owner if the hosting layer is resource-constrained

---

## Runbook: Login or access failures

### Symptom

- users cannot log in
- users are redirected unexpectedly
- admins cannot access admin pages

### Likely causes

- Supabase Auth issue
- missing `profiles` row
- incorrect role assignment
- blocked or inactive email domain
- middleware/session issue

### Diagnostics

1. Confirm the user exists in Supabase Auth.
2. Confirm a matching `profiles` row exists.
3. Confirm `profiles.role` is correct.
4. Confirm the user’s email domain is active in `signup_email_domains`.
5. Check whether the issue affects all users or one user.

### Resolution

1. Create or repair the missing profile record.
2. Correct the user role.
3. Activate the user’s email domain if appropriate.
4. Re-test login and admin route access.

### Escalation

- escalate to the Supabase administrator if Auth records or policies are inconsistent

---

## Runbook: Feature requests or attachments failing

### Symptom

- feature requests do not load
- comments or votes fail
- attachment upload fails

### Likely causes

- Supabase table access failure
- broken storage bucket or policy
- request validation failure
- service-role configuration issue

### Diagnostics

1. Check recent logs for `/api/feature-requests` endpoints.
2. Determine whether reads, writes, comments, votes, or uploads are failing.
3. Confirm `feature_requests`, `feature_request_comments`, and `votes` are accessible.
4. Confirm the `feature-uploads` bucket exists and has working policies.

### Resolution

1. Restore or repair Supabase table access and policies.
2. Restore the `feature-uploads` bucket if missing.
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is valid if signed URLs are failing.

### Escalation

- escalate to the Supabase owner for schema, policy, or storage failures

---

## Runbook: Contentstack content not rendering

### Symptom

- homepage, demo websites, demo instructions, videos, or navigation fail to load correctly

### Likely causes

- expired or incorrect Contentstack token
- incorrect environment or branch
- changed content model
- missing required entry or reference

### Diagnostics

1. Identify which page or content type is failing.
2. Review logs for related requests.
3. Confirm Contentstack environment and tokens are correct.
4. Confirm the expected content type and entry still exist.
5. Check whether content fields or references changed recently.

### Resolution

1. Restore the correct Contentstack token or environment configuration.
2. Revert breaking content-model changes.
3. Restore missing entries or references.

### Escalation

- escalate to the Contentstack administrator if model or token issues are involved

---

## Runbook: Logging or metrics missing

### Symptom

- `/admin/logs` shows no recent entries
- `/admin/metrics` is empty or stale

### Likely causes

- `LOG_INGEST_SECRET` mismatch
- service-role key issue
- logging writes failing
- scheduled metrics jobs not running

### Diagnostics

1. Confirm the application is generating traffic.
2. Check whether recent API calls appear in `logs`.
3. Confirm `LOG_INGEST_SECRET` is configured consistently.
4. Confirm `SUPABASE_SERVICE_ROLE_KEY` is valid.
5. Confirm the aggregation jobs are still running.

### Resolution

1. Restore the correct log ingest secret.
2. Restore or rotate the service-role key.
3. Repair scheduled jobs for metrics aggregation.

### Escalation

- escalate to the Supabase administrator for job and database issues

---

## Runbook: Deploy a new version

### Procedure

1. Confirm the target branch or release commit.
2. Run lint and tests.
3. Ensure environment variables are already configured in the target environment.
4. Deploy through the hosting platform.
5. Perform the post-deployment smoke test:
   - login
   - homepage
   - feature requests
   - one Contentstack-backed page
   - one admin page
6. Monitor logs and metrics for regressions.

---

## Runbook: Roll back a bad release

### Procedure

1. Identify the last known good deployment.
2. Redeploy or promote that release through the hosting platform.
3. Re-run the smoke test.
4. Monitor logs and metrics to confirm recovery.
5. Document the cause of failure before the next release.

---

## Maintenance rule

These runbooks should be updated whenever:

- hosting changes
- deployment process changes
- monitoring changes
- Supabase architecture changes
- Contentstack model dependencies change

