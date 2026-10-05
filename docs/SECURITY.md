# İKÜANTS TEKMER — SECURITY & HARDENING ARCHITECTURE

## 1. Security Architecture Principles

The platform follows a strict **Defense in Depth** strategy:
- **Deny by Default**: All administrative endpoints require explicit role/action grants.
- **Least Privilege**: Users are granted only the minimum permissions necessary for their duties.
- **Encapsulated Data Protection**: Sensitive citizen data (e.g. TCKN) is encrypted at rest and masked in memory.

---

## 2. Implemented Security Controls

### 2.1. Authentication & Session Security
- **JWT via Secure Cookies**: Tokens stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies preventing XSS-based theft.
- **Session Revocation**: Password reset immediately invalidates all prior sessions (`isValid: false`).
- **RFC 6238 TOTP Multi-Factor Authentication**: Single-use bcrypt-hashed emergency recovery codes.
- **Brute-Force Throttling**: Exponential delays and temporary account lockouts after 5 consecutive failed login attempts.

### 2.2. Input Validation & Sanitization
- **HTML Sanitization (`lib/sanitize.ts`)**: DOMPurify-based whitelist stripping scripts, `<iframe>`, `javascript:` URIs, and dangerous attributes.
- **SVG Upload Security**: Cleanses embedded XML scripts and event handlers from uploaded SVG assets.
- **CSV Formula Injection Neutralization**: Prepends single quotes `'` to formulas starting with `=`, `+`, `-`, `@` to prevent spreadsheet code execution.
- **Turkish ID (TCKN) Encryption**: Automatically masked to `*******1234` format; reveals require explicit `view_sensitive` permissions and log an immutable audit trail.

### 2.3. Request Gate & Rate Limiting
- **CSRF & Origin Verification**: Validates `Origin` and `Host` headers on mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`).
- **Distributed Rate Limiting**: In-memory and Redis-backed sliding window rate limiters per IP and per endpoint.
- **Integration Hub Hardening**: Third-party credentials are encrypted with AES-256-GCM (`INTEGRATION_ENCRYPTION_KEY`, required in production) and never returned to the browser (only short hints). Outbound requests are limited to public `https://` hosts: localhost, private / link-local / CGNAT ranges and names resolving to them are rejected (SSRF guard), redirects are not followed, requests time out after 10 s, and query strings are never written to the call log.
- **Inbound API Keys**: `/api/v1/*` accepts scoped, revocable, optionally expiring keys (`ik_<prefix>_<secret>`); only the SHA-256 hash is stored and the key is shown once. Responses are read-only summaries without identity data; 120 requests / minute per client.
- **Signed Webhooks**: Outgoing webhooks carry `X-Ikuants-Signature: t=<unix>,v1=<HMAC-SHA256("t.body")>` with a per-subscription secret shown once; payloads contain references only (no personal data).
- **Permission Delegation Guard**: Personal permission overrides and role edits require `roles:manage`; non-super admins cannot grant permissions they do not hold or change their own, and super admins cannot be restricted.
- **Clickjacking Protection**: Every response carries `X-Frame-Options: DENY` and `frame-ancestors 'none'`. The only exception is a public page requested with `?studio=1` or `?embed=1` (design studio canvas and admin live preview): those responses use `SAMEORIGIN` / `frame-ancestors 'self'`, so they can be framed by the admin panel on the same origin and never by another site. Draft content in the studio canvas is still shown only to signed-in editors with `edit:cms`.

### 2.4. Privilege Escalation & Audit Trail
- Non-superadmins cannot grant `SUPER_ADMIN` roles or escalate their own permission scope.
- The last active `SUPER_ADMIN` account cannot be deleted or deactivated.
- Immutable `AuditLog` records actor, action, target entity, timestamp, IP, and diff metadata.
