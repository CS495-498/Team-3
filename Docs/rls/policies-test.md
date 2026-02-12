# RLS Policy Testing Documentation

## Overview

This document outlines manual database-level tests performed to verify
Row Level Security (RLS) enforcement for user-facing tables.

Testing was performed in the Supabase SQL Editor using role simulation
(`set role`, `set request.jwt.claim.sub`).

**Replace 'USER_UUID' with real UUID**

------------------------------------------------------------------------

# Test 1 --- Unauthorized Read (Anon Access)

## Objective

Verify anonymous users cannot access protected tables.

## Test

``` sql
set role anon;
select * from public.profiles limit 1;
```

## Expected Result

-   Zero rows returned

## Status

*PASS*

------------------------------------------------------------------------

# Test 2 --- Authenticated User Can Read Own Profile

## Objective

Ensure authenticated users can read their own data.  


## Test

``` sql
set role authenticated;
set request.jwt.claim.sub = 'USER_UUID';

select * from public.profiles
where id = current_setting('request.jwt.claim.sub')::uuid;
```

## Expected Result

-   Returns exactly one row (the user's profile)

## Status

*PASS*

------------------------------------------------------------------------

# Test 3 --- Cross-User Access Blocked

## Objective

Ensure users cannot read another user's profile.

## Test

``` sql
set role authenticated;
set request.jwt.claim.sub = 'USER_A_UUID';

select * from public.profiles
where id = 'USER_B_UUID';
```

## Expected Result

-   Zero rows returned

## Status

*PASS*

------------------------------------------------------------------------

# Test 4 --- Role Escalation Blocked

## Objective

Ensure user cannot modify their own role.

Make sure UUID is of non-admin role before running.

## Test

``` sql
set role authenticated;
set request.jwt.claim.sub = 'USER_UUID';

update public.profiles
set role = 'admin'
where id = current_setting('request.jwt.claim.sub')::uuid;
```

## Expected Result

-   ERROR: row-level security policy violation

## Status

*PASS*

------------------------------------------------------------------------

# Test 5 --- Authorized Admin Update Succeeds

## Objective

Ensure admins can modify profiles.

## Test

``` sql
set role authenticated;
set request.jwt.claim.sub = 'ADMIN_UUID';

update public.profiles
set role = 'contentstack'
where id = 'TARGET_USER_UUID';
```

## Expected Result

-   Update succeeds

## Status

*PASS*

------------------------------------------------------------------------

# Test 6 --- Valid Insert Allowed

## Objective
Ensure users can insert a valid vote tied to their identity while satisfying NOT NULL constraints.

## Test

```sql
set role authenticated;
set request.jwt.claim.sub = 'USER_UUID';

insert into public.votes (
  user_id,
  req_id,
  "Upvoted"
)
values (
  current_setting('request.jwt.claim.sub')::uuid,
  'FEATURE_REQUEST_UUID_HERE'::uuid,
  true
);
```
## Expected Result

-   Update succeeds

## Status

*PASS*


------------------------------------------------------------------------

# Service Role Validation

The service role was verified to bypass RLS when used via backend server
routes.

The `SUPABASE_SERVICE_ROLE_KEY`: - Is not exposed using `NEXT_PUBLIC_` -
Is not used in client-side code - Exists only in server modules

Status: VERIFIED

------------------------------------------------------------------------
