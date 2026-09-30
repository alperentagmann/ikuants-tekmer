# İKÜANTS TEKMER — EXTERNAL REQUIREMENTS & CREDENTIALS MATRIX

## 1. External Account & Credentials Checklist

The following external credentials and API access tokens are required only when activating full live production integrations. In local development, all features operate safely in resilient simulated/fallback mode.

| Integration | Required Credentials / Details | Purpose | Status in Dev |
| :--- | :--- | :--- | :--- |
| **Microsoft 365** | • Azure Tenant ID<br>• Entra App Client ID<br>• Client Secret<br>• Scopes: `Calendars.ReadWrite`, `Mail.Send` | Direct Outlook calendar synchronization and Teams meeting creation | `SIMULATION (ICS Export Ready)` |
| **Email Relay** | • SMTP Host (e.g. `smtp.iku.edu.tr` or AWS SES)<br>• Port (587/465)<br>• Username<br>• Password / API Key | Automated applicant confirmations and notification digests | `SIMULATION (Active Outbox)` |
| **Meta / Instagram** | • Meta App ID<br>• Meta App Secret<br>• Long-Lived Instagram Graph Page Token | Importing TEKMER social posts as automatic news drafts | `NOT CONFIGURED` |
| **KOSGEB KBS** | • KBS API Gateway URL<br>• Institution Client ID<br>• X.509 Certificate or Secret Token | Statutory synchronization of startup and grant records | `READY (CSV/XLSX Exporter Active)` |
| **Cloud Storage** | • AWS S3 Bucket Name / Region<br>• Access Key ID<br>• Secret Access Key | Offloading media and large applicant proposal documents | `LOCAL DISK ACTIVE` |
