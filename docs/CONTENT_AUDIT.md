# İKÜANTS TEKMER — CONTENT AUDIT & DISCREPANCY REPORT

## 1. Audit Methodology

The content audit evaluated discrepancies between:
- Live Domain: `https://www.ikuantstekmer.com/`
- Reference Deployment: `https://ikuants-tekmer.vercel.app/`
- Local Database Schema & Seed Data

---

## 2. Audit Findings & Resolution Matrix

| Resource / Section | Audit Status | Discrepancy Found | Resolution Implemented |
| :--- | :--- | :--- | :--- |
| **Hero Slider Count** | `RESOLVED` | Initial migration had 8 slides; reference contains 23 visual assets. | Expanded `HeroSlide` schema and seed to 23 records with all local assets. |
| **Navbar Top Menu** | `RESOLVED` | Menu items disappeared due to `label` vs `title` property mapping. | Updated `Navbar.tsx` to handle `m.label || m.title` with DB seed fallback. |
| **Unpublished Startups** | `RESOLVED` | 7 specific companies were requested hidden from public view. | Retained in DB with `isPublished: false`. Super Admin retains visibility & toggle. |
| **Program Nomenclature** | `RESOLVED` | Hardcoded programs risked data divergence. | Dynamic `Program` models created for ANTSPARK, ANTSFire, and Glow Up. |
| **Mentor Profiles** | `RESOLVED` | Missing LinkedIn & Organization metadata. | Enriched DB seed with titles, companies, bios and headshot paths. |

---

## 3. Discrepancy Classifications

- **DUPLICATE**: None remaining. Partner logo duplication eliminated.
- **CONFLICT**: None remaining.
- **OUTDATED_CANDIDATE**: Legacy hardcoded fallback arrays in `content.ts` updated to match live Vercel production texts.
- **NEEDS_REVIEW**: External social media feeds and KBS sync (pending institutional API keys).
