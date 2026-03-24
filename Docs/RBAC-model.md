# RBAC Documentation

## Purpose

This document provides a practical overview of how role-based access control (RBAC) is currently implemented in the application. It explains the active roles, the permissions assigned to each role, and how those permissions are enforced across the UI, API routes, and backend logic.

It is intended for developers, admins, and relevant team members who need an accurate reference for how access works today. The content reflects the current implementation in code, not a future-state or aspirational access model.

---

## Sources Reviewed

Core RBAC behavior is implemented across these files:

- `src/config/permissions.js`
- `src/config/rolePermissions.js`
- `src/utils/hasPermission.js`
- `src/utils/auth/requirePermission.js`
- `src/utils/auth/requireAuthWithPermission.js`
- `src/utils/Supabase/middleware.js`
- `src/context/UserContext.jsx`
- `src/context/RoleContext.jsx`
- `src/components/app-sidebar.jsx`
- `src/app/api/**`
- `src/app/(with-sidebar)/**`

---

## RBAC Overview

The application uses a **static role-to-permission mapping** stored in code.

### How it works

1. Authentication is handled by **Supabase**.
2. The authenticated user's role is loaded from the `profiles` table.
3. Permissions are resolved from the in-code `ROLE_PERMISSIONS` map.
4. API routes enforce access using `requireAuthWithPermission(permission)`.
5. The UI hides or shows actions using `hasPermission(user.role, permission)`.
6. Some operations add an extra **ownership check** on top of RBAC.

### Source of truth

The effective RBAC source of truth is:

- `profiles.role` for the user's assigned role
- `src/config/rolePermissions.js` for what that role can do

---

## Current Roles

The system currently defines the following role keys in `src/config/rolePermissions.js`:

- `partner`
- `contentstack`
- `admin`

In this document, these are referred to as **Partner**, **Contentstack**, and **Admin**.

### Role descriptions

| Role | Purpose |
|---|---|
| **Partner** | Baseline user role for standard authenticated users. Can view content and participate in feature request workflows. |
| **Contentstack** | Content editor and publisher role. Inherits Partner access and adds permissions for publishing demo instructions, managing feature requests, and updating content resources such as demo websites, video library entries, and assets. |
| **Admin** | Full administrative role. Inherits Contentstack access and adds permissions for user management, notifications, metrics, logs, personas, and platform-wide moderation capabilities. |

---

## Permission Catalog

The following permissions are currently declared in `src/config/permissions.js` and actively reflected in the current RBAC model:

| Permission Key | Notes |
|---|---|
| `MANAGE_USERS` | User administration |
| `VIEW_LOGS` | Access to logs dashboard |
| `VIEW_METRICS` | Access to metrics APIs |
| `UPLOAD_NOTIFICATIONS` | Manage homepage alerts/notifications |
| `PUBLISH_DEMO_INSTRUCTIONS` | Create/update demo instructions |
| `PUBLISH_FEATURE_REQUESTS` | Create/edit/delete feature requests |
| `MANAGE_ALL_FEATURE_REQUESTS` | Global edit/delete of any feature request |
| `MANAGE_ALL_COMMENTS` | Global comment moderation |
| `COMMENT_VOTE_FEATURE_REQUESTS` | Create/edit/delete comments and vote |
| `VIEW_CONTENT` | Read feature-request content and related views |
| `USE_PERSONAS` | Persona creation/switch/delete |
| `UPLOAD_DEMO_WEBSITES` | Update/delete demo websites |
| `UPLOAD_VIDEO_LIBRARY` | Update video library |
| `UPLOAD_ASSET` | Upload Contentstack assets |

---

## Role-to-Permission Matrix

Defined in `src/config/rolePermissions.js`.

| Permission Key | Partner | Contentstack | Admin |
|---|---:|---:|---:|
| `VIEW_CONTENT` | Yes | Yes | Yes |
| `COMMENT_VOTE_FEATURE_REQUESTS` | Yes | Yes | Yes |
| `PUBLISH_FEATURE_REQUESTS` | No | Yes | Yes |
| `UPLOAD_DEMO_WEBSITES` | No | Yes | Yes |
| `UPLOAD_VIDEO_LIBRARY` | No | Yes | Yes |
| `UPLOAD_ASSET` | No | Yes | Yes |
| `PUBLISH_DEMO_INSTRUCTIONS` | No | Yes | Yes |
| `USE_PERSONAS` | No | No | Yes |
| `MANAGE_USERS` | No | No | Yes |
| `UPLOAD_NOTIFICATIONS` | No | No | Yes |
| `VIEW_LOGS` | No | No | Yes |
| `VIEW_METRICS` | No | No | Yes |
| `MANAGE_ALL_FEATURE_REQUESTS` | No | No | Yes |
| `MANAGE_ALL_COMMENTS` | No | No | Yes |

---

## What Each Role Can Access

### Partner

#### Intended purpose
Partner is the baseline authenticated role for standard users.

#### Permissions
- `VIEW_CONTENT`
- `COMMENT_VOTE_FEATURE_REQUESTS`

#### Effective access
Partners can:
- View feature requests and related content
- Read comments on feature requests
- Vote on feature requests
- Create comments on feature requests
- Edit and delete their own comments

Partners cannot:
- Create feature requests
- Publish demo instructions
- Edit demo website content
- Update video library entries
- Upload assets
- Manage users
- View logs or metrics
- Use personas
- Manage notifications/alerts
- Globally edit feature requests or comments

---

### Contentstack

#### Intended purpose
Contentstack is the content editing and publishing role.

#### Permissions
Includes all Partner permissions plus:
- `PUBLISH_FEATURE_REQUESTS`
- `UPLOAD_DEMO_WEBSITES`
- `UPLOAD_VIDEO_LIBRARY`
- `UPLOAD_ASSET`
- `PUBLISH_DEMO_INSTRUCTIONS`

#### Effective access
Contentstack users can:
- Do everything a Partner can do
- Create feature requests
- Edit and delete their own feature requests
- Publish and update demo instructions
- Update and delete demo website content
- Update video library content
- Upload assets to Contentstack

Contentstack users cannot:
- Manage users
- View logs or metrics
- Use personas
- Update homepage notifications
- Edit or delete feature requests created by other users
- Globally moderate all comments

---

### Admin

#### Intended purpose
Admin is the highest-privilege operational role.

#### Permissions
Includes all Contentstack permissions plus:
- `USE_PERSONAS`
- `MANAGE_USERS`
- `UPLOAD_NOTIFICATIONS`
- `VIEW_LOGS`
- `VIEW_METRICS`
- `MANAGE_ALL_FEATURE_REQUESTS`
- `MANAGE_ALL_COMMENTS`

#### Effective access
Admins can:
- Do everything Contentstack users can do
- View admin navigation and access admin APIs
- List users
- Update other users' role, email, profile fields, and active persona ID
- Delete other users
- Manage notifications and alerts
- Access logs dashboard APIs
- Access metrics APIs
- Create, switch, and delete personas they own
- Edit and delete any feature request
- Moderate comments across the system

---

## Server-Side Enforcement Pattern

### Main authorization helper
File: `src/utils/auth/requireAuthWithPermission.js`

This is the main backend authorization utility.

#### Behavior
It performs these steps:
1. Creates a Supabase server client.
2. Checks the authenticated user via `supabase.auth.getUser()`.
3. Returns `401 Unauthorized` if there is no valid session.
4. Loads the user's `profiles` row and reads `id`, `role`, and `full_name`.
5. Returns `404 Profile not found` if missing.
6. Resolves the role against `ROLE_PERMISSIONS`.
7. Returns `403 Forbidden` if the requested permission is not present.
8. Returns `{ user, profile, supabase }` if authorized.

#### Why this matters
This means RBAC is enforced **server-side** using the user's current role from the database. UI checks alone do not grant access.

---

## Middleware Enforcement

File: `src/utils/Supabase/middleware.js`

The middleware does two things:
- refreshes and maintains the Supabase session
- blocks access to `/admin*` routes unless the user has `MANAGE_USERS`

### Public exceptions
The middleware skips auth checks for:
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/session`
- `/login`
- `/_next/*`

### Admin section behavior
For any URL beginning with `/admin`, the middleware:
- loads the current user's `role` from `profiles`
- resolves permissions via `ROLE_PERMISSIONS[role]`
- redirects to `/unauthorized` unless the user has `MANAGE_USERS`

### Practical effect
Only Admin users can reach any `/admin` page.

This is stricter than the sidebar model, which lists separate admin pages for user management, logs, and metrics. In practice today this is acceptable because only Admin has those admin permissions.

---

## UI Enforcement Examples

UI enforcement is implemented through `hasPermission(role, permission)` in `src/utils/hasPermission.js` and user data from `UserContext`.

### Example 1: Admin sidebar navigation
File: `src/components/app-sidebar.jsx`

The sidebar declares:
- User Management → `MANAGE_USERS`
- Logs → `VIEW_LOGS`
- Metrics → `VIEW_METRICS`

Then filters those links using `hasPermission(user.role, page.permission)`.

**Result:** users only see admin links allowed by their role.

### Example 2: Homepage alert editing
File: `src/app/(with-sidebar)/page.js`

The page computes:
- `canUploadNotifications = hasPermission(user.role, PERMISSIONS.UPLOAD_NOTIFICATIONS)`

**Result:** only Admin users see UI to manage homepage notifications.

### Example 3: Demo website editing
File: `src/app/(with-sidebar)/demo-websites/page.js`

The page computes:
- `canUploadDemoWebsites = hasPermission(user.role, PERMISSIONS.UPLOAD_DEMO_WEBSITES)`

**Result:** Contentstack and Admin users can see editing controls.

### Example 4: Demo instructions publishing
Files:
- `src/app/(with-sidebar)/demo-instructions/page.js`
- `src/app/(with-sidebar)/demo-instructions/[title]/page.js`

The pages compute:
- `canPublishDemoInstructions = hasPermission(user.role, PERMISSIONS.PUBLISH_DEMO_INSTRUCTIONS)`

**Result:** Contentstack and Admin users can see publishing and editing actions.

### Example 5: Feature request management UI
File: `src/app/(with-sidebar)/feature-requests/page.js`

The page computes:
- `canManageAll = hasPermission(user.role, PERMISSIONS.MANAGE_ALL_FEATURE_REQUESTS)`
- `canManageAllComments = hasPermission(user.role, PERMISSIONS.MANAGE_ALL_COMMENTS)`
- `canPublish = hasPermission(user.role, PERMISSIONS.PUBLISH_FEATURE_REQUESTS)`

It then uses those flags to decide whether the current user can:
- edit their own feature request
- edit any feature request
- modify comments in the UI

**Result:** UI behavior matches the RBAC model for role-based access and moderation controls.

---

## API Enforcement Examples

### User management APIs

#### `GET /api/profiles`
File: `src/app/api/profiles/route.js`
- Requires `MANAGE_USERS`
- Returns full user and profile list via RPC

#### `PATCH /api/profiles/[id]`
File: `src/app/api/profiles/[id]/route.js`
- Requires `MANAGE_USERS`
- Allows updating another user's email, role, profile fields, and active persona ID
- Validates `role` with `isValidRole(role)`

#### `DELETE /api/profiles/[id]`
File: `src/app/api/profiles/[id]/route.js`
- Requires `MANAGE_USERS`
- Prevents an admin from deleting their own account

### Personas APIs

Files:
- `src/app/api/personas/route.js`
- `src/app/api/personas/[id]/route.js`
- `src/app/api/personas/switch/route.js`

All persona operations require `USE_PERSONAS`.
Only Admin has this permission.

#### Enforced scenarios
- Admin can create a persona for themselves
- Admin can switch their active persona
- Admin can delete only personas they own

This is RBAC plus ownership validation.

### Feature request APIs

#### Read feature requests
File: `src/app/api/feature-requests/route.js`
- `GET /api/feature-requests`
- Requires `VIEW_CONTENT`

**Who gets access:** Partner, Contentstack, Admin

#### Create feature request
File: `src/app/api/feature-requests/route.js`
- `POST /api/feature-requests`
- Requires `PUBLISH_FEATURE_REQUESTS`

**Who gets access:** Contentstack, Admin

#### Edit and delete feature request
File: `src/app/api/feature-requests/[id]/route.js`
- Requires `PUBLISH_FEATURE_REQUESTS`
- If the user does **not** have `MANAGE_ALL_FEATURE_REQUESTS`, the query is additionally limited to `.eq("user_id", profile.id)`

**Who gets access:**
- Contentstack can edit and delete only their own requests
- Admin can edit and delete any request

#### Read comments on a feature request
File: `src/app/api/feature-requests/[id]/comments/route.js`
- `GET`
- Requires `VIEW_CONTENT`

#### Create a comment
File: `src/app/api/feature-requests/[id]/comments/route.js`
- `POST`
- Requires `COMMENT_VOTE_FEATURE_REQUESTS`

#### Edit and delete a comment
File: `src/app/api/feature-requests/comments/[id]/route.js`
- `PUT` and `DELETE`
- Requires `COMMENT_VOTE_FEATURE_REQUESTS`
- Applies ownership or moderation rules according to the current RBAC implementation

#### Vote on a feature request
File: `src/app/api/feature-requests/[id]/vote/route.js`
- Requires `COMMENT_VOTE_FEATURE_REQUESTS`

#### Read current user's votes
File: `src/app/api/votes/route.js`
- Requires `VIEW_CONTENT`

---

## Content Editing and Publishing Rules

The following RBAC rules affect content editing, publishing, and viewing.

### Viewing content
- `VIEW_CONTENT` is the main read permission used for feature-request content and related comment views.
- All three roles currently have this permission.

### Editing feature requests
- `PUBLISH_FEATURE_REQUESTS` is required to create, edit, or delete feature requests.
- Contentstack and Admin have this permission.
- `MANAGE_ALL_FEATURE_REQUESTS` extends this so Admin can manage requests created by other users.

### Commenting and voting
- `COMMENT_VOTE_FEATURE_REQUESTS` controls comment creation and voting.
- All three roles have this permission.
- Comment edit and delete access is enforced according to the current route-level RBAC logic.

### Demo instructions
- `PUBLISH_DEMO_INSTRUCTIONS` controls writing demo instructions.
- Contentstack and Admin have this permission.

### Demo websites
- `UPLOAD_DEMO_WEBSITES` controls update and delete operations for demo website content.
- Contentstack and Admin have this permission.

### Video library
- `UPLOAD_VIDEO_LIBRARY` controls video library updates.
- Contentstack and Admin have this permission.

### Asset uploads
- `UPLOAD_ASSET` controls asset upload to Contentstack.
- Contentstack and Admin have this permission.

### Notifications and alerts
- `UPLOAD_NOTIFICATIONS` controls homepage alert management.
- Only Admin has this permission.

### Admin operations
- `MANAGE_USERS`, `VIEW_LOGS`, and `VIEW_METRICS` are Admin-only permissions.
- `/admin*` routes are also blocked by middleware unless the user has `MANAGE_USERS`.

---

## Example Scenarios

### Scenario 1: Partner opens feature requests page
- UI: allowed
- API: `GET /api/feature-requests` succeeds because Partner has `VIEW_CONTENT`
- Partner can read requests, vote, and comment
- Partner cannot create a new feature request because `PUBLISH_FEATURE_REQUESTS` is missing

### Scenario 2: Contentstack user edits their own feature request
- UI: edit controls are shown
- API: `PUT /api/feature-requests/[id]` succeeds because the user has `PUBLISH_FEATURE_REQUESTS`
- Backend also checks ownership if the user lacks `MANAGE_ALL_FEATURE_REQUESTS`
- Result: edit succeeds only for their own request

### Scenario 3: Contentstack user tries to edit someone else's feature request
- UI: edit control should not be shown
- API: request hits `PUT /api/feature-requests/[id]`
- Backend adds `.eq("user_id", profile.id)` to the update query
- Result: request is rejected as forbidden

### Scenario 4: Admin opens admin metrics page
- UI: metrics link is visible because Admin has `VIEW_METRICS`
- Middleware: `/admin*` access is allowed because Admin has `MANAGE_USERS`
- API: metrics endpoints require `VIEW_METRICS`
- Result: full access

### Scenario 5: Partner attempts to call user management API directly
- UI: user management link is hidden
- Middleware: `/admin*` pages are blocked
- API: `GET /api/profiles` returns `403 Forbidden` because Partner lacks `MANAGE_USERS`

### Scenario 6: Admin performs cross-system moderation actions
- UI: moderation controls are visible where supported by the role
- API: admin-only routes and moderation routes are enforced by the current permission model
- Result: Admin retains elevated moderation and management access within the current RBAC implementation

---

## Current Gaps, Restrictions, and Special Cases

The middleware blocks all `/admin*` routes unless the user has `MANAGE_USERS`.

Today that still effectively means “Admin only,” but if future roles are introduced with `VIEW_LOGS` or `VIEW_METRICS` without `MANAGE_USERS`, those users would still be blocked from `/admin` pages.

---

## Maintainability Guidance

To keep this documentation accurate as roles evolve:

1. Treat `src/config/permissions.js` as the canonical permission catalog.
2. Treat `src/config/rolePermissions.js` as the canonical role matrix.
3. Any new API route should either:
   - use `requireAuthWithPermission(...)`, or
   - clearly document why ownership-only enforcement is appropriate.
4. Any UI-gated action should have matching server-side enforcement.
5. When adding a new role, update:
   - `rolePermissions.js`
   - this document
   - admin/sidebar navigation logic if needed
   - middleware behavior for `/admin` if the new role should access admin pages
6. Review permissions and route coverage regularly to prevent drift between implementation and documentation.

---

## Summary

The current RBAC model is clear and centralized at the role-to-permission level:

- **Partner** = baseline viewer and participant
- **Contentstack** = content editor and publisher
- **Admin** = full administrative access

RBAC is enforced through a combination of:
- centralized role-to-permission mapping
- server-side authorization through `requireAuthWithPermission(...)`
- UI visibility controls through `hasPermission(...)`
- ownership checks for selected resources
