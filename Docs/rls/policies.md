| tablename                | policyname                                | roles           | cmd    | qual                                             | with_check                                                                                                                  |
| ------------------------ | ----------------------------------------- | --------------- | ------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| bookmarks                | Users can manage their own bookmarks      | {public}        | ALL    | (auth.uid() = user_id)                           | (auth.uid() = user_id)                                                                                                      |
| feature_request_comments | admin delete any comment                  | {public}        | DELETE | has_permission('manage_users'::text)             | null                                                                                                                        |
| feature_request_comments | author delete own comment                 | {public}        | DELETE | (user_id = auth.uid())                           | null                                                                                                                        |
| feature_request_comments | create feature request comment            | {public}        | INSERT | null                                             | (has_permission('comment_vote_feature_requests'::text) AND (user_id = auth.uid()))                                          |
| feature_request_comments | view feature request comments             | {public}        | SELECT | has_permission('view_content'::text)             | null                                                                                                                        |
| feature_request_comments | author update own comment                 | {public}        | UPDATE | (user_id = auth.uid())                           | (user_id = auth.uid())                                                                                                      |
| feature_requests         | create feature request                    | {public}        | INSERT | null                                             | (has_permission('publish_feature_requests'::text) AND (user_id = auth.uid()))                                               |
| feature_requests         | view feature requests                     | {public}        | SELECT | has_permission('view_content'::text)             | null                                                                                                                        |
| feature_requests         | admin/contentstack update feature request | {public}        | UPDATE | has_permission('publish_feature_requests'::text) | has_permission('publish_feature_requests'::text)                                                                            |
| feature_requests         | author update feature request             | {public}        | UPDATE | (user_id = auth.uid())                           | (user_id = auth.uid())                                                                                                      |
| personas                 | admin manage personas                     | {authenticated} | ALL    | has_permission('use_personas'::text)             | has_permission('use_personas'::text)                                                                                        |
| profiles                 | profiles_delete_admin_only                | {public}        | DELETE | is_admin()                                       | null                                                                                                                        |
| profiles                 | profiles_select_own_or_admin              | {public}        | SELECT | ((auth.uid() = id) OR is_admin())                | null                                                                                                                        |
| profiles                 | admin update profiles                     | {authenticated} | UPDATE | is_admin()                                       | is_admin()                                                                                                                  |
| profiles                 | users update own profile (no role change) | {authenticated} | UPDATE | (auth.uid() = id)                                | ((auth.uid() = id) AND (role = ( SELECT profiles_1.role
   FROM profiles profiles_1
  WHERE (profiles_1.id = auth.uid())))) |
| votes                    | Users can delete their own votes          | {authenticated} | DELETE | (auth.uid() = user_id)                           | null                                                                                                                        |
| votes                    | Users can insert their own votes          | {authenticated} | INSERT | null                                             | (auth.uid() = user_id)                                                                                                      |
| votes                    | cast vote                                 | {public}        | INSERT | null                                             | (has_permission('comment_vote_feature_requests'::text) AND (user_id = auth.uid()))                                          |
| votes                    | view votes                                | {public}        | SELECT | has_permission('view_content'::text)             | null                                                                                                                        |
| votes                    | Users can update their own votes          | {authenticated} | UPDATE | (auth.uid() = user_id)                           | (auth.uid() = user_id)                                                                                                      |
| votes                    | update own vote                           | {public}        | UPDATE | (user_id = auth.uid())                           | (user_id = auth.uid())                                                                                                      |


# Row Level Security (RLS) Documentation

## Overview

Row Level Security (RLS) is enabled on all user-facing tables in the `public` schema.  
Access is denied by default unless explicitly allowed by policy.

Permissions are enforced using:

- `auth.uid()` for ownership checks  
- `has_permission(<permission>)` for RBAC enforcement  
- `is_admin()` for privileged administrative access  

The Supabase `service_role` bypasses RLS as expected and is used only in server-side code.

---

# Table: `bookmarks`

## Purpose
Allows users to bookmark items.

## Policies

### Users can manage their own bookmarks
- Role: `public`
- Operation: `ALL`
- Rule:
  - `auth.uid() = user_id` (USING + WITH CHECK)

## Effect
- Users can only read, insert, update, or delete their own bookmarks.
- No cross-user access permitted.

---

# Table: `feature_request_comments`

## Purpose
Stores comments associated with feature requests.

## Policies

### View feature request comments
- Role: `public`
- Operation: `SELECT`
- Rule: `has_permission('view_content')`

### Create feature request comment
- Role: `public`
- Operation: `INSERT`
- Rule:
  - Must have `comment_vote_feature_requests`
  - `user_id = auth.uid()`

### Author update own comment
- Role: `public`
- Operation: `UPDATE`
- Rule:
  - `user_id = auth.uid()` (USING + WITH CHECK)

### Author delete own comment
- Role: `public`
- Operation: `DELETE`
- Rule:
  - `user_id = auth.uid()`

### Admin delete any comment
- Role: `public`
- Operation: `DELETE`
- Rule:
  - `has_permission('manage_users')`

## Effect
- Users can manage only their own comments.
- Admin can delete any comment.
- Viewing requires `view_content` permission.

---

# Table: `feature_requests`

## Purpose
Stores user-submitted feature requests.

## Policies

### View feature requests
- Role: `public`
- Operation: `SELECT`
- Rule:
  - `has_permission('view_content')`

### Create feature request
- Role: `public`
- Operation: `INSERT`
- Rule:
  - Must have `publish_feature_requests`
  - `user_id = auth.uid()`

### Author update feature request
- Role: `public`
- Operation: `UPDATE`
- Rule:
  - `user_id = auth.uid()` (USING + WITH CHECK)

### Admin/Contentstack update feature request
- Role: `public`
- Operation: `UPDATE`
- Rule:
  - `has_permission('publish_feature_requests')` (USING + WITH CHECK)

## Effect
- Authors can update their own requests.
- Authorized roles can update any request.

---

# Table: `personas`

## Purpose
Administrative persona configuration.

## Policies

### Admin manage personas
- Role: `authenticated`
- Operation: `ALL`
- Rule:
  - `has_permission('use_personas')` (USING + WITH CHECK)

## Effect
- Only authorized administrative users can read or modify personas.
- No public access.

---

# Table: `profiles`

## Purpose
Stores user profile information and roles.

## Policies

### Select own profile or admin
- Role: `public`
- Operation: `SELECT`
- Rule:
  - `auth.uid() = id OR is_admin()`

### Users update own profile (no role change)
- Role: `authenticated`
- Operation: `UPDATE`
- Rule:
  - `auth.uid() = id`
  - `role` must remain unchanged

### Admin update profiles
- Role: `authenticated`
- Operation: `UPDATE`
- Rule:
  - `is_admin()` (USING + WITH CHECK)

### Admin delete profiles
- Role: `public`
- Operation: `DELETE`
- Rule:
  - `is_admin()`

## Effect
- Users may update their own profile information.
- Users cannot change their role (prevents privilege escalation).
- Admin retains full control.

---

# Table: `votes`

## Purpose
Stores user votes on feature requests.

## Policies

### View votes
- Role: `public`
- Operation: `SELECT`
- Rule:
  - `has_permission('view_content')`

### Users insert their own votes
- Role: `authenticated`
- Operation: `INSERT`
- Rule:
  - `auth.uid() = user_id`

### Users update their own votes
- Role: `authenticated`
- Operation: `UPDATE`
- Rule:
  - `auth.uid() = user_id` (USING + WITH CHECK)

### Users delete their own votes
- Role: `authenticated`
- Operation: `DELETE`
- Rule:
  - `auth.uid() = user_id`

### Cast vote
- Role: `public`
- Operation: `INSERT`
- Rule:
  - `has_permission('comment_vote_feature_requests')`
  - `user_id = auth.uid()`

### Update own vote
- Role: `public`
- Operation: `UPDATE`
- Rule:
  - `user_id = auth.uid()` (USING + WITH CHECK)

## Effect
- Ownership enforced for all modifications.
- Permission checks enforced where required.
- No cross-user vote manipulation allowed.

---

# Acceptance Criteria Summary

- RLS enabled on all user-facing tables  
- Default access denied unless policy exists  
- Role-based policies defined (`public`, `authenticated`, admin via permission)  
- User data isolation enforced  
- Role escalation prevented  
- Service role bypass verified and not exposed client-side  
- Existing application flows tested and functioning with RLS enabled  
- Policies documented for maintainability
