# FluentWave Deployment & Launch Configuration Guide

This guide contains the exact steps to launch FluentWave online with free/low-cost industry-standard cloud providers:
1. **Frontend**: Vercel / Netlify / Cloudflare Pages / GitHub Pages
2. **Backend**: Render / Railway / Fly.io / AWS Lightsail
3. **Database**: Supabase (PostgreSQL with built-in Auth & S3 Storage)
4. **Google OAuth Client ID setup**

---

## 1. Setting Up Google Sign In (OAuth 2.0)
To enable real Google Sign In on your custom domain:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: `FluentWave Production`.
3. Go to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth client ID**.
5. Application type: **Web application**.
6. Name: `FluentWave Web Client`.
7. **Authorized JavaScript origins**:
   * For local testing: `http://localhost:8000` and `http://localhost:4000`
   * For production: `https://yourdomain.com` (or your Vercel/Netlify URL)
8. **Authorized redirect URIs**:
   * `https://yourdomain.com/auth.html`
9. Copy your **Client ID** and replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` in `auth.html` or set it in your `.env`.

---

## 2. Deploying Frontend to Vercel or Netlify (Zero Configuration)
The frontend consists of static HTML, CSS, and modern JS with zero complex build steps.

### Option A: Deploy to Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account (`Jamapa205`).
2. Click **Add New Project** and import `Jamapa205/FluentWave`.
3. Root Directory: `./` (root).
4. Click **Deploy**. Vercel will give you a live production URL: `https://fluentwave.vercel.app`.

### Option B: Deploy to GitHub Pages (100% Free)
1. On your GitHub repository: `https://github.com/Jamapa205/FluentWave`.
2. Go to **Settings** > **Pages**.
3. Under **Branch**, select `master` / root and click **Save**.
4. Your site will be live at `https://jamapa205.github.io/FluentWave/`.

---

## 3. Deploying the TypeScript Backend to Render or Railway

### Option A: Render (Free Web Service)
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **New +** > **Web Service**.
3. Connect `Jamapa205/FluentWave`.
4. Configure:
   * **Root Directory**: `backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Add Environment Variables:
   * `PORT`: `4000`
   * `NODE_ENV`: `production`
6. Click **Deploy**. Render gives you a live HTTPS backend URL (e.g. `https://fluentwave-api.onrender.com`).

---

## 4. Production Database Setup (Supabase PostgreSQL)
1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open the **SQL Editor**.
3. Paste the contents of [`backend/migrations/001_initial_schema.sql`](file:///c:/endis%20new%20suff/backend/migrations/001_initial_schema.sql) and click **Run**.
4. All tables, custom enums, immutability triggers, and indexes are now active!
