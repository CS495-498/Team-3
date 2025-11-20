# Next.js Feature Requests & Profiles API
**Version: 1.0.0**

This API provides authenticated access to **feature requests** and **user profiles** within a Next.js application. It uses **Supabase SSR cookies** for authentication and enforces user-level access control on all protected resources.

---

## Authentication

This API uses a Supabase session cookie:

```
sb-ibfgbeocmmbnpziqjdtu-auth-token=<token>
```

To test authenticated requests (e.g., in Postman):

1. Log into your application to obtain a session cookie  
2. Copy the cookie value  
3. Add it as a `Cookie` header:

```
Cookie: sb-ibfgbeocmmbnpziqjdtu-auth-token=<token>
```

Unauthorized requests return:

- **401 Unauthorized**

---

## Base URL

```
http://localhost:3000
```

---

## API Domains

### Feature Requests  
Operations for creating, reading, updating, and deleting user-owned feature requests.

### Profiles  
Operations for viewing user profiles and updating your own profile.

---

## Endpoints

### Feature Requests

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/feature-requests` | List all feature requests for the authenticated user | Yes |
| POST | `/api/feature-requests` | Create a new feature request | Yes |
| GET | `/api/feature-requests/{id}` | Get a single request (only if owned by user) | Yes |
| PUT | `/api/feature-requests/{id}` | Update a request (only if owned by user) | Yes |
| DELETE | `/api/feature-requests/{id}` | Delete a request (only if owned by user) | Yes |

#### FeatureRequest Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| user_id | UUID | Owner of the request |
| Title | string | Title of the feature |
| Content | string | Feature description |
| created_at | date-time | Timestamp created |
| updated_at | date-time | Timestamp updated |

---

### Profiles

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/profiles` | List all user profiles | Yes |
| GET | `/api/profiles/{id}` | Retrieve a profile by ID | Yes |
| PUT | `/api/profiles/{id}` | Update your own profile | Yes |

#### Profile Schema

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Profile owner |
| username | string | Username |
| full_name | string | Full display name |
| avatar_url | string | Profile image URL |
| website | string | Personal website |
| updated_at | date-time | Last modified timestamp |

---

## Example Requests

### Create a Feature Request

```http
POST /api/feature-requests
Content-Type: application/json
Cookie: sb-ibfgbeocmmbnpziqjdtu-auth-token=<token>

{
  "Title": "Dark Mode",
  "Content": "Add a toggle for dark mode"
}
```

---

### Update a Profile

```http
PUT /api/profiles/{id}
Content-Type: application/json
Cookie: sb-ibfgbeocmmbnpziqjdtu-auth-token=<token>

{
  "username": "johndoe",
  "website": "https://johndoe.com"
}
```

---

## Error Handling

| Status | Meaning | Explanation |
|--------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication cookie |
| 404 | Not Found | Resource does not exist or is not owned by the user |
| 400 | Bad Request | Invalid request body or missing fields |

---

## Summary

This API implements:

- Cookie-based authentication using Supabase  
- User-scoped access to feature requests  
- Read access to all profiles and update access to the user’s own profile  
- Consistent JSON responses and validation rules
