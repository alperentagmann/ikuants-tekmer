# İKÜANTS TEKMER — EXTERNAL INTEGRATIONS MATRIX

## 1. Integration Status Overview

| Integration Service | Implementation Type | Protocol / Library | Status in Local Dev | Production Readiness |
| :--- | :--- | :--- | :--- | :--- |
| **Email Outbox Engine** | Dedicated Service | SMTP / Nodemailer | `SIMULATION (Active Outbox)` | Ready (Awaiting Live SMTP Env) |
| **Microsoft 365 / Teams** | Webhook & ICS Adapter | MS Graph / Webhooks | `READY (Simulated Fallback)` | Ready (Awaiting Entra App Secret) |
| **Instagram / Meta** | Social Graph Sync | Meta Graph API | `NOT CONFIGURED` | Ready (Awaiting App Token) |
| **KOSGEB KBS Sync** | Two-Way ETL Adapter | REST / XML Exporter | `READY FOR INTEGRATION` | Ready (Awaiting KBS API Docs) |
| **Malware / AV Scanner** | Magic Byte & MIME Check | ClamAV / Node Stream | `SIMULATION` | Ready (Awaiting Daemon Host) |
| **Redis Cache / Rate Limit** | Key-Value Store | Upstash / Redis Client | `IN-MEMORY FALLBACK` | Ready (Awaiting Redis URL) |
| **Media Storage** | Local & Object Storage | Next.js Static / S3 | `LOCAL DISK STORAGE` | Ready (S3 Compatible) |

---

## 2. Adapter Architecture

Each external integration is built with a resilient decoupled adapter pattern:
- The system never throws unhandled runtime exceptions when an external service is offline or unconfigured.
- Graceful degradation: The UI informs the administrator with a clean `NOT CONFIGURED` badge.
- When credentials are supplied via environment variables, the service activates immediately without code refactoring.
