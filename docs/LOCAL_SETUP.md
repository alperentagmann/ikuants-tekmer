# İKÜANTS TEKMER — LOCAL SETUP GUIDE

## 1. Prerequisites

- **Node.js**: v20.x or later (LTS recommended)
- **Package Manager**: npm or pnpm
- **Operating System**: Windows, macOS, or Linux

---

## 2. Quickstart Step-by-Step

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local variables utilize embedded PostgreSQL and mock JWT secrets.

### Step 3: Initialize Database Schema & Seed Content
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### Step 4: Bootstrap Super Admin Account
```bash
npm run bootstrap:prod
```
This initializes the primary super admin:
- **Email**: `bilgi@ikuantstekmer.com`
- Set your password via the interactive prompt or `npm run admin` CLI.

### Step 5: Start Local Development Server
```bash
npm run dev
```

---

## 3. Access URLs
- **Public Digital Showcase**: [http://localhost:3000](http://localhost:3000)
- **Super Admin OS / CMS**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Run Automated Test Suites**: `npm test`
