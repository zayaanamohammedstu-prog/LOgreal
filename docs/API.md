# LogGuard API Documentation

## Base URL

```
http://localhost:5000/api
```

All endpoints are prefixed with `/api`. Authentication uses JWT Bearer tokens.

---

## Authentication

Most endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/login`. Access tokens expire after 15 minutes; use `/api/auth/refresh` to obtain a new one using a refresh token.

---

## Roles & Permissions

| Role         | Description                                      |
|--------------|--------------------------------------------------|
| `viewer`     | Read-only access to their own audit logs         |
| `auditor`    | Can generate and download reports                |
| `admin`      | Can manage users and approve registrations       |
| `superadmin` | Full system access, including role management    |

---

## Error Format

All errors return a JSON body:

```json
{
  "error": "Human-readable error message."
}
```

### Common HTTP Status Codes

| Code | Meaning                  |
|------|--------------------------|
| 200  | OK                        |
| 201  | Created                   |
| 400  | Bad Request               |
| 401  | Unauthorized              |
| 403  | Forbidden                 |
| 404  | Not Found                 |
| 429  | Too Many Requests         |
| 500  | Internal Server Error     |

---

## Auth Endpoints

### POST /api/auth/register

Initiate registration. Sends a verification OTP to the provided email.

**Rate limit:** 10 per hour

**Request body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass@123"
}
```

**Response 200:**
```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "user@example.com"
}
```

**Response 400:**
```json
{ "error": "Email already registered." }
```

---

### POST /api/auth/verify-otp

Step 2 of registration — verifies the OTP and creates the user account (pending admin approval).

**Rate limit:** 10 per hour

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response 201:**
```json
{
  "message": "Registration successful. Your account is pending admin approval."
}
```

**Response 400:**
```json
{ "error": "Invalid or expired OTP." }
```

---

### POST /api/auth/login

Authenticate with email and password.

**Rate limit:** 20 per hour

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response 200 (no MFA):**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "viewer",
    "is_active": true,
    "is_approved": true,
    "totp_enabled": false
  }
}
```

**Response 200 (MFA required):**
```json
{
  "mfa_required": true,
  "access_token": "<temporary_jwt>"
}
```

---

### POST /api/auth/login/mfa

Complete MFA login with a TOTP code.

**Auth:** Bearer token (temporary token from `/login`)
**Rate limit:** 20 per hour

**Request body:**
```json
{
  "totp_code": "123456"
}
```

**Response 200:**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "user": { ... }
}
```

---

### POST /api/auth/logout

Invalidate the current session.

**Auth:** Bearer token (optional)

**Response 200:**
```json
{ "message": "Logged out successfully." }
```

---

### POST /api/auth/refresh

Obtain a new access token using a refresh token.

**Auth:** Bearer refresh token

**Response 200:**
```json
{
  "access_token": "<new_jwt>"
}
```

---

### GET /api/auth/me

Get current authenticated user's profile.

**Auth:** Required

**Response 200:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "admin",
  "is_active": true,
  "is_approved": true,
  "totp_enabled": true,
  "avatar_url": null,
  "created_at": "2024-01-15T10:30:00+00:00",
  "last_login": "2024-04-10T08:00:00+00:00"
}
```

---

### POST /api/auth/mfa/setup

Generate a TOTP secret and QR code URI for MFA setup.

**Auth:** Required

**Response 200:**
```json
{
  "totp_uri": "otpauth://totp/LogGuard:user@example.com?secret=BASE32SECRET&issuer=LogGuard",
  "secret": "BASE32SECRET"
}
```

---

### POST /api/auth/mfa/enable

Enable MFA after verifying the TOTP code.

**Auth:** Required

**Request body:**
```json
{ "totp_code": "123456" }
```

**Response 200:**
```json
{ "message": "MFA enabled successfully." }
```

---

### POST /api/auth/mfa/disable

Disable MFA by confirming with a TOTP code.

**Auth:** Required

**Request body:**
```json
{ "totp_code": "123456" }
```

**Response 200:**
```json
{ "message": "MFA disabled." }
```

---

### POST /api/auth/change-password

Change the authenticated user's password.

**Auth:** Required

**Request body:**
```json
{
  "current_password": "OldPass@123",
  "new_password": "NewPass@456"
}
```

**Response 200:**
```json
{ "message": "Password changed successfully." }
```

---

## Dashboard Endpoints

### GET /api/dashboard/viewer

Viewer dashboard — returns current user info and recent personal activity.

**Auth:** Required (any approved role)

**Response 200:**
```json
{
  "user": { ... },
  "recent_activity": [
    {
      "id": 42,
      "action": "login",
      "resource": "auth",
      "status": "success",
      "ip_address": "192.168.1.1",
      "timestamp": "2024-04-10T08:00:00+00:00"
    }
  ]
}
```

---

### GET /api/dashboard/auditor

Auditor dashboard — summary statistics.

**Auth:** Required (auditor+)

**Response 200:**
```json
{
  "total_logs": 1540,
  "logs_today": 72,
  "failed_logins_today": 3,
  "reports_generated": 12
}
```

---

### GET /api/dashboard/admin

Admin dashboard — pending registrations, user stats, system overview.

**Auth:** Required (admin+)

**Response 200:**
```json
{
  "pending_registrations": 4,
  "total_users": 38,
  "active_users": 35,
  "total_audit_logs": 15400
}
```

---

## Admin Endpoints

All admin endpoints require **admin** role or higher.

### GET /api/admin/registrations

List registration requests.

**Query params:**
| Param     | Type   | Default   | Description                         |
|-----------|--------|-----------|-------------------------------------|
| `page`    | int    | 1         | Page number                         |
| `per_page`| int    | 20        | Items per page                      |
| `status`  | string | `pending` | Filter: `pending`, `approved`, `rejected` |

**Response 200:**
```json
{
  "registrations": [
    {
      "id": 5,
      "email": "newuser@example.com",
      "username": "newuser",
      "status": "pending",
      "created_at": "2024-04-09T12:00:00+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

---

### POST /api/admin/registrations/:id/approve

Approve a registration request.

**Request body (optional):**
```json
{ "note": "Welcome aboard!" }
```

**Response 200:**
```json
{ "message": "Registration approved. User account created." }
```

---

### POST /api/admin/registrations/:id/reject

Reject a registration request.

**Request body (optional):**
```json
{ "note": "Does not meet requirements." }
```

**Response 200:**
```json
{ "message": "Registration rejected." }
```

---

### GET /api/admin/users

List all users.

**Query params:** `page`, `per_page`, `role`, `search`

**Response 200:**
```json
{
  "users": [ { ...user_dict... } ],
  "total": 38,
  "page": 1,
  "per_page": 20
}
```

---

### GET /api/admin/users/:id

Get a specific user's details.

**Response 200:** User object (see `GET /api/auth/me`)

---

### PATCH /api/admin/users/:id

Update a user's role or status.

**Auth:** Required (superadmin for role changes)

**Request body:**
```json
{
  "role": "auditor",
  "is_active": true
}
```

**Response 200:**
```json
{ "message": "User updated.", "user": { ... } }
```

---

### DELETE /api/admin/users/:id

Deactivate (soft-delete) a user.

**Auth:** Required (superadmin)

**Response 200:**
```json
{ "message": "User deactivated." }
```

---

### GET /api/admin/audit-logs

List all audit logs with filters.

**Query params:**
| Param       | Type   | Description                     |
|-------------|--------|---------------------------------|
| `page`      | int    | Page number (default: 1)        |
| `per_page`  | int    | Items per page (default: 50)    |
| `user_id`   | int    | Filter by user ID               |
| `action`    | string | Filter by action type           |
| `status`    | string | `success` or `failure`          |
| `from`      | string | ISO 8601 start timestamp        |
| `to`        | string | ISO 8601 end timestamp          |

**Response 200:**
```json
{
  "logs": [
    {
      "id": 101,
      "user_id": 3,
      "username": "johndoe",
      "action": "login",
      "resource": "auth",
      "status": "success",
      "ip_address": "10.0.0.1",
      "details": {},
      "timestamp": "2024-04-10T08:00:00+00:00"
    }
  ],
  "total": 1540,
  "page": 1,
  "per_page": 50
}
```

---

## Reports Endpoints

### POST /api/reports/generate

Generate a report file synchronously.

**Auth:** Required (auditor+)

**Request body:**
```json
{
  "title": "April Audit Report",
  "report_type": "audit_logs",
  "format": "pdf",
  "parameters": {
    "from": "2024-04-01T00:00:00Z",
    "to": "2024-04-30T23:59:59Z",
    "status": "failure"
  }
}
```

**`report_type` values:** `audit_logs`, `users`
**`format` values:** `pdf`, `excel`, `csv`

**Response 201:**
```json
{
  "message": "Report generated.",
  "report": {
    "id": 7,
    "title": "April Audit Report",
    "report_type": "audit_logs",
    "format": "pdf",
    "generated_by": "johndoe",
    "created_at": "2024-04-10T09:00:00+00:00"
  }
}
```

---

### GET /api/reports

List reports for the current user (auditor sees own; admin sees all).

**Query params:** `page`, `per_page`

**Response 200:**
```json
{
  "reports": [ { ...report_dict... } ],
  "total": 7,
  "page": 1,
  "per_page": 20
}
```

---

### GET /api/reports/:id/download

Download a generated report file.

**Auth:** Required (auditor+; admin can download any)

**Response 200:** Binary file stream with appropriate `Content-Type` and `Content-Disposition` headers.

---

### POST /api/reports/:id/email

Email a report to the current user.

**Auth:** Required (auditor+)

**Response 200:**
```json
{ "message": "Report emailed to user@example.com." }
```

---

### POST /api/reports/:id/whatsapp

Send a report notification via WhatsApp.

**Auth:** Required (auditor+)

**Request body:**
```json
{ "phone": "+1234567890" }
```

**Response 200:**
```json
{ "message": "WhatsApp notification sent." }
```

---

## Health Endpoint

### GET /health

Returns service health status (no auth required).

**Response 200:**
```json
{ "status": "ok" }
```

---

## WebSocket Events

LogGuard uses Socket.IO for real-time notifications. Connect to `ws://localhost:5000`.

### Client → Server

| Event          | Payload             | Description                      |
|----------------|---------------------|----------------------------------|
| `authenticate` | `{ token: "<jwt>" }` | Authenticate the WS connection  |

### Server → Client

| Event               | Payload                          | Description                          |
|---------------------|----------------------------------|--------------------------------------|
| `new_audit_log`     | `{ log: { ...log_dict... } }`   | Emitted when a new audit log is created |
| `registration_alert`| `{ count: 3 }`                  | New pending registration notification (admin+) |
| `notification`      | `{ message: "...", type: "info" }` | General notification                |

---

## Rate Limits

| Endpoint group         | Limit           |
|------------------------|-----------------|
| `/api/auth/register`   | 10 per hour     |
| `/api/auth/verify-otp` | 10 per hour     |
| `/api/auth/login`      | 20 per hour     |
| `/api/auth/login/mfa`  | 20 per hour     |
| All other endpoints    | 200 per minute  |

Rate limit responses return HTTP `429` with:
```json
{ "error": "Too many requests. Please slow down." }
```
