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

### 2.4. Privilege Escalation & Audit Trail
- Non-superadmins cannot grant `SUPER_ADMIN` roles or escalate their own permission scope.
- The last active `SUPER_ADMIN` account cannot be deleted or deactivated.
- Immutable `AuditLog` records actor, action, target entity, timestamp, IP, and diff metadata.
