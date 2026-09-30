# ================================================================
# İKÜANTS TEKMER — CLAUDE CODE GUIDELINES & ARCHITECTURE MANUAL
# ================================================================

## 1. CRITICAL RELEASE & SAFETY POLICY (NON-NEGOTIABLE)

- **LOCAL DEVELOPMENT ONLY**: Do not deploy to production or run remote migrations.
- **NO GIT PUSH WITHOUT EXPLICIT USER APPROVAL**: Never run `git push`, create remote branches, or trigger CI/CD workflows unless the user explicitly commands: `"GITHUB'A GÖNDER"`.
- **NO PRODUCTION DEPLOYMENT WITHOUT EXPLICIT APPROVAL**: Never perform Vercel production deploy, DNS/Domain alterations, or production DB mutations unless the user explicitly commands: `"CANLIYA AL"`.
- **LOCAL ACCESS TARGETS**:
  - Public Digital Experience: `http://localhost:3000`
  - Super Admin Operating System: `http://localhost:3000/admin`

---

## 2. SYSTEM ARCHITECTURE

```
                               ┌───────────────────────────┐
                               │   PUBLIC EXPERIENCE       │
                               │   (Next.js App Router)    │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
 ┌───────────────────────────┐  Server Actions / REST APIs  ┌───────────────────────────┐
 │   SUPER ADMIN OS / CMS    ├─────────────────────────────►│    SERVICE / DOMAIN LAYER │
 │   (CRM, Ops, Kanban, BI)  │                              │    (TypeScript Services)  │
 └───────────────────────────┘                              └─────────────┬─────────────┘
                                                                          │
                                                                          ▼
                                                            ┌───────────────────────────┐
                                                            │   PRISMA ORM / POSTGRES   │
                                                            │   (Embedded & Remote DB)  │
                                                            └───────────────────────────┘
```

### Core Architecture Layers:
1. **Public Web Experience (`app/(public)`)**:
   - Modern, editorial, institutional brand presentation.
   - High-fidelity Framer Motion animations with `prefers-reduced-motion` compliance.
   - 23 dynamic Hero slides from database with robust static fallback.
   - Fully accessible navigation, dynamic program and entrepreneur showcases.

2. **Internal Digital Operations Platform (`app/admin`)**:
   - **Super Admin CMS**: Homepage Studio, Page Builder, Navigation Builder, Media Library, Form Builder, News CMS.
   - **CRM & Stakeholder Hub**: Applications Pipeline, Entrepreneur CRM, Mentor Hub, Stakeholder Directory.
   - **Daily Workspace**: Benim Günüm (My Day), Todo, Notification Center, Global Ctrl+K Search.
   - **Operations & Collaboration**: Kanban Task Studio, Unified Calendar, Meetings, Activities, Projects/Grants, Events & Trainings.
   - **Management Intelligence**: Daily, Monthly, Annual, and Custom BI Reporting Center.
   - **System, Security & RBAC**: Granular permissions (`resource:action`), TOTP MFA, Single-use recovery codes, Immutable Audit Logs, CSRF & XSS fortification.

3. **Domain Service Layer (`lib/services/`)**:
   - Business logic encapsulated strictly in dedicated services.
   - Never query Prisma directly inside client components.

---

## 3. COMMANDS REFERENCE

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on `localhost:3000` |
| `npm run build` | Validates Prisma schema and creates Next.js production build |
| `npm test` | Executes full suite of 93+ automated unit, integration & E2E tests |
| `npm run seed` | Seeds database with 23 hero slides, programs, entrepreneurs, mentors & default roles |
| `npm run bootstrap:prod` | Bootstraps production-ready Super Admin (`bilgi@ikuantstekmer.com`) and default configurations |
| `npm run admin` | CLI tool to manage admin accounts, grant roles, and list users |
| `npx prisma generate` | Regenerates Prisma Client |
| `npx prisma db push` | Synchronizes schema with embedded/local database |

---

## 4. CODING CONVENTIONS

- **TypeScript Strictness**: Strictly typed interfaces for all models, DTOs, and API responses. No `any` types.
- **Server vs Client Boundaries**: Mark client components explicitly with `'use client'`. Server components used by default for SSR and SEO.
- **Sanitization & Security**:
  - User HTML inputs sanitized using `lib/sanitize.ts` (`sanitizeHtml`, `sanitizeSvg`, `sanitizeCsvCell`).
  - Turkish ID Numbers (TCKN) encrypted and masked by default (`maskTcNumber`).
  - Sensitive DB fields protected by server-side authorization filters.
- **Auditing**: Every mutation (create, update, delete, role change, PII reveal) must log an entry via `logAuditEvent`.

---

## 5. DIRECTORY STRUCTURE MAP

```
ikuants-tekmer/
├── app/
│   ├── (public)/              # Public pages (Hakkimizda, Programlar, Girisimciler, etc.)
│   ├── admin/                 # Super Admin & Workspace routes (Dashboard, Benim Gunum, etc.)
│   ├── api/                   # REST API routes with RBAC middleware and rate limiting
│   └── globals.css            # Tailored design system tokens and Tailwind CSS rules
├── components/
│   ├── admin/                 # Admin UI components (Sidebar, Kanban, StatsCard, etc.)
│   ├── layout/                # Global Navbar, Footer, MobileNav
│   ├── sections/              # Public section components (Hero, Programs, Mentors, etc.)
│   └── ui/                    # Reusable primitives (Buttons, Modals, Badges, Tabs)
├── data/                      # Static fallback data (content.ts)
├── docs/                      # Architectural, security, integration and user documentation
├── lib/                       # Utilities, auth, RBAC, MFA, rate limit, sanitization
│   └── services/              # Domain service layer (TaskService, EntrepreneurService, etc.)
├── prisma/                    # Schema definitions and seeding scripts
├── public/                    # Static assets, hero images (23 slides), logos, icons
├── scripts/                   # CLI maintenance and database management scripts
└── tests/                     # 16 test suites covering 93+ automated test cases
```
