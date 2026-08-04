# 🚀 AttendX Vercel Deployment Guide

AttendX is fully configured and ready for **100% cloud deployment on Vercel**.

---

## ⚡ Deployment Architecture

```
                               ┌────────────────────────────────┐
                               │     Vercel Deployment Cloud    │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               │                               │                               │
               ▼                               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
    │  Desktop Frontend    │        │   Mobile Frontend    │        │  Serverless API      │
    │  (React Vite SPA)    │        │  (React Vite SPA)    │        │  (Express Node.js)   │
    └──────────────────────┘        └──────────────────────┘        └──────────┬───────────┘
                                                                               │
                                                                               ▼
                                                                    ┌──────────────────────┐
                                                                    │   Cloud PostgreSQL   │
                                                                    │  (Neon / Supabase)   │
                                                                    └──────────────────────┘
```

---

## 🛠️ Step-by-Step Deployment Options

### Option A: Separate Vercel Projects (Recommended)

1. **Deploy Hosted Database**:
   - Create a free cloud PostgreSQL database on **[Neon.tech](https://neon.tech)** or **[Supabase](https://supabase.com)**.
   - Copy your PostgreSQL connection string: `postgresql://user:password@host/attendx?sslmode=require`.

2. **Deploy Backend**:
   - Push repository to GitHub.
   - Connect Vercel to `backend/` root directory.
   - Set Vercel Environment Variables:
     - `DATABASE_URL`: Your Neon/Supabase PostgreSQL connection string.
     - `JWT_SECRET`: `your_secure_random_jwt_secret_key`
     - `ADMIN_EMAIL`: `admin@attendx.com`
     - `ADMIN_PASSWORD`: `YourSecurePassword123`
   - Run Prisma database migration command on deployment:
     ```bash
     npx prisma db push
     ```

3. **Deploy Desktop & Mobile Frontends**:
   - Import `frontend/` to Vercel (Root Directory: `frontend`, Build Command: `npm run build`, Output Directory: `dist`).
   - Import `mobile/` to Vercel (Root Directory: `mobile`, Build Command: `npm run build`, Output Directory: `dist`).

---

### Option B: Monorepo Single Vercel Project

Using the included root **[`vercel.json`](file:///Users/vivan/Desktop/PROTOTYPE/vercel.json)**:
- Vercel automatically routes `/api/*` requests to the Express serverless handler at [`backend/api/index.ts`](file:///Users/vivan/Desktop/PROTOTYPE/backend/api/index.ts).
- Serves static SPA assets from `frontend/dist` and `mobile/dist`.
