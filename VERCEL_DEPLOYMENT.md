# 🚀 AttendX Comprehensive Vercel Deployment & Troubleshooting Guide

AttendX is an enterprise GPS-based workforce attendance and administration platform consisting of:
1. **Desktop Web App** (`frontend/`): React 18 + Vite SPA with rich analytics, attendance tracking, and administrative controls.
2. **Mobile Web App** (`mobile/`): Mobile-optimized touch-first React 18 + Vite SPA for field check-in/out and profile management.
3. **Backend API** (`backend/` & `api/`): Node.js + Express + Prisma ORM + PostgreSQL Serverless API.

---

## 🔍 Why Did the Previous Vercel Deployment Fail?

1. **Missing Root Build Orchestration**:
   - Vercel's legacy `vercel.json` attempted to run only `@vercel/node` on `backend/api/index.ts`.
   - The Vite frontend (`frontend/dist`) was never compiled during Vercel's build step.
   - When users visited `https://your-domain.vercel.app/`, the serverless handler looked for static assets in non-existent `dist` directories and returned `404: NOT_FOUND` or crashed.
2. **Serverless Database Mismatch**:
   - The local dev environment relied on an embedded PostgreSQL fallback (`embedded-postgres`), which cannot run in Vercel's read-only serverless runtime.
   - Without an external cloud PostgreSQL URL (`DATABASE_URL`), the serverless function timed out or threw runtime connection errors.
3. **Missing Root Package.json & Entrypoint**:
   - Without a root `package.json` and top-level `api/` handler, Vercel could not bundle Prisma engines and multi-package dependencies properly.

---

## 🛠️ The Fix Applied

We have fixed the project structure:
1. **Root `package.json`**:
   - Configured `npm run vercel-build` which automatically installs dependencies, executes `npx prisma generate`, and compiles `frontend` and `backend`.
2. **Top-Level `api/index.ts`**:
   - Created the native Vercel serverless function entrypoint.
3. **Updated `vercel.json`**:
   - Routes `/api/*` to the serverless backend function `/api/index.ts`.
   - Directs all SPA page routes (`/login`, `/dashboard`, `/history`, `/reports`, `/admin`) to `frontend/dist/index.html`.
   - Serves cached static assets directly via Vercel's global Edge CDN (`/assets/*`).
4. **Security Hardening**:
   - Fixed CORS origin validation.
   - Added production checks for OAuth mock pickers.
   - Enforced secure cookie flags in production.

---

## ⚡ Deployment Instructions

### 1. Database Setup (Prerequisite)
1. Create a free hosted PostgreSQL database on **[Neon.tech](https://neon.tech)** or **[Supabase](https://supabase.com)**.
2. Copy your connection URL:
   ```
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.us-east-2.aws.neon.tech/attendx?sslmode=require"
   DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.us-east-2.aws.neon.tech/attendx?sslmode=require"
   ```
3. Push the schema to your remote database from your local machine:
   ```bash
   cd backend
   npx prisma db push
   npm run seed
   ```

### 2. Deploy Monorepo to Vercel
1. Push this repository to your GitHub account.
2. Go to **[Vercel Dashboard](https://vercel.com/new)** and import the repository.
3. Keep the **Root Directory** as `./` (the root).
4. Add the following **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`: Your remote PostgreSQL connection string
   - `DIRECT_URL`: (Optional, for Neon connection pooling)
   - `JWT_ACCESS_SECRET`: `generate_a_secure_random_64_char_secret_key`
   - `JWT_REFRESH_SECRET`: `generate_a_secure_random_64_char_secret_key`
   - `NODE_ENV`: `production`
   - `ADMIN_EMAIL`: `admin@attendx.com`
   - `ADMIN_PASSWORD`: `AdminPassword123!`
5. Click **Deploy**.

---

## 📱 Deploying the Mobile App as a Dedicated PWA (Optional Subdomain)
If you wish to host the dedicated mobile interface on `m.attendx.com` or a separate Vercel URL:
1. In Vercel, click **Add New Project** -> Import the same repository.
2. Set **Root Directory** to `mobile`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Set `VITE_API_URL` to your main backend Vercel URL (e.g., `https://attendx.vercel.app/api`).
