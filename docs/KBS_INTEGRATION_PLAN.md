# İKÜANTS TEKMER — KOSGEB KBS INTEGRATION PLAN

## 1. Context & Objectives

The KOSGEB Enterprise Information System (KBS - Kurumsal Bilgi Sistemi) is the national statutory platform through which TEKMER performance indicators, entrepreneur admissions, graduations, and grant allocations are officially reported.

To eliminate duplicate data entry and administrative overhead:
1. İKÜANTS TEKMER platform serves as the internal operational System of Record.
2. Verified records are exported or synchronized with KBS via batch export and API adapters.

---

## 2. Shared Data Entities & Mapping

| İKÜANTS TEKMER Entity | KBS Equivalent Entity | Sync Frequency | Source of Truth |
| :--- | :--- | :--- | :--- |
| `Entrepreneur` | Girişimci / Şirket Bilgileri | On Admission & Status Change | İKÜANTS TEKMER |
| `Application` | TEKMER Ön Başvuru | Real-time / Daily | İKÜANTS TEKMER |
| `MentorSession` | Mentörlük Faaliyet Raporu | Monthly | İKÜANTS TEKMER |
| `Activity` | TEKMER Etkinlik & Faaliyetler | Quarterly | İKÜANTS TEKMER |
| `GrantAllocation` | KOSGEB Hibe & Destekler | On Disbursement | KBS (External Ingest) |

---

## 3. Implementation Phases

1. **Phase 1 (Active)**: Standardized CSV and XLSX export matching official KOSGEB KBS column schema (`/admin/raporlar/kurumsal`).
2. **Phase 2 (Ready for Integration)**: Secure REST API client with OAuth2 / mutual TLS authentication once KOSGEB credentials and WSDL/OpenAPI specs are provided by the institution.
3. **Phase 3**: Bidirectional Webhook receiver for automated state synchronizations.
