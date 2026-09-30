# İKÜANTS TEKMER — BACKUP & DISASTER RECOVERY PLAN

## 1. Backup Strategy

### 1.1. Relational Database (PostgreSQL)
- **Continuous Backups**: Point-in-Time Recovery (PITR) with 30-day retention.
- **Daily Snapshot**: Automated daily logical dump via `pg_dump` compressed with GZIP.
- **Storage Location**: Geographically redundant encrypted S3 bucket (`eu-central-1` / `eu-west-1`).

### 1.2. Media & Uploaded Files
- S3 Bucket versioning enabled.
- Cross-region replication for uploaded applicant documents and media files.

---

## 2. Disaster Recovery Procedure

### 2.1. Restoring PostgreSQL from Dump
```bash
# 1. Download latest dump
aws s3 cp s3://ikuants-backups/db/latest.sql.gz ./latest.sql.gz
gunzip latest.sql.gz

# 2. Restore into target database
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f latest.sql

# 3. Verify data integrity
npm test
```

### 2.2. Recovery Time & Point Objectives
- **RTO (Recovery Time Objective)**: < 30 minutes.
- **RPO (Recovery Point Objective)**: < 5 minutes (via PITR WAL streaming).
