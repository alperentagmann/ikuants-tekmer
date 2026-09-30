# İKÜANTS TEKMER — CONTENT MIGRATION GUIDE

## 1. Migration Overview

The migration pipeline transitions legacy static content and remote public data into the relational PostgreSQL database using idempotent scripts.

---

## 2. Migration Scripts

### 2.1. Full Legacy Data Importer
- **Script**: `scripts/import-legacy-public-data.ts`
- **Execution**: `npm run import:legacy`
- **Actions**:
  - Migrates 23 hero slides into `HeroSlide` table with ordering and active flags.
  - Migrates core navigation menu items into `NavigationItem` with child hierarchy.
  - Seeds official incubation programs (ANTSPARK, ANTSFire, Glow Up) into `Program`.
  - Migrates 30+ active entrepreneurs into `Entrepreneur` with company logo, status, and publish flags.
  - Migrates academic and professional mentors into `Mentor` with photo, expertise, and LinkedIn URL.
  - Migrates news, events, and FAQs into `NewsArticle`, `Event`, and `FaqItem`.

### 2.2. Production Super Admin Bootstrapper
- **Script**: `scripts/bootstrap-production.ts`
- **Execution**: `npm run bootstrap:prod`
- **Actions**:
  - Bootstraps primary Super Admin (`bilgi@ikuantstekmer.com`).
  - Sets up role matrix (`SUPER_ADMIN`, `ADMIN`, `CONTENT_EDITOR`, etc.).
  - Initializes brand tokens and default pipeline lifecycle stages.
