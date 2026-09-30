# İKÜANTS TEKMER — PRODUCTION DEPLOYMENT RUNBOOK

## 1. Production Release Policy

> [!IMPORTANT]
> **STRICT SAFETY GUARD**: Never deploy to production, run remote migrations, or alter DNS settings without explicit written command: `"CANLIYA AL"`.

---

## 2. Production Architecture Requirements

1. **Hosting Platform**: Vercel Enterprise / AWS ECS / Node.js Standalone Container.
2. **Managed Database**: PostgreSQL 16+ (AWS Aurora / Neon / Supabase).
3. **Object Storage**: AWS S3 or Cloudflare R2 for uploaded user media.
4. **Caching & Queue**: Upstash Redis or managed Redis cluster.
5. **SMTP Relay**: AWS SES, SendGrid, or Resend.

---

## 3. Deployment Checklist

- [ ] Run automated test suite: `npm test` (Ensure 100% pass rate across 93+ tests).
- [ ] Run Prisma validation: `npx prisma validate`.
- [ ] Run TypeScript and bundle check: `npm run build`.
- [ ] Verify environment variables configured in production secret manager.
- [ ] Execute database migrations: `npx prisma migrate deploy`.
- [ ] Run smoke test on health endpoint: `GET /api/health`.
- [ ] Verify SSL/TLS and security headers (`HSTS`, `X-Content-Type-Options`, `Content-Security-Policy`).
