<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:e67e22,100:f39c12&height=220&section=header&text=🍽️%20Foodelight&fontSize=78&fontColor=ffffff&fontAlignY=38&desc=Goodbye%20junk%20food.%0AHello%20super%20healthy%20meals.&descAlignY=58&descSize=22&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=e67e22&center=true&vCenter=true&width=640&lines=Full-Stack+Food+Delivery+Platform+🍕;Flask+%2B+Vercel+Serverless+%E2%9A%A1;Email+OTP+Auth+%2B+Supabase+DB+🔐;Admin+Panel+%2B+Multi-Page+Frontend+🖥️;Open+Source+%26+Deploy-Ready+🚀)](https://git.io/typing-svg)

<br/>

<a href="https://foodelight-24223088.vercel.app">
  <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-e67e22?style=for-the-badge&labelColor=1a1a1a" />
</a>
&nbsp;
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white&labelColor=1a1a1a" />
&nbsp;
<img src="https://img.shields.io/badge/Flask-4.0-e67e22?style=for-the-badge&logo=flask&logoColor=white&labelColor=1a1a1a" />
&nbsp;
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=1a1a1a" />
&nbsp;
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=1a1a1a" />

<br/><br/>

> **Foodelight** is a production-ready, serverless food delivery platform built with Flask and deployed on Vercel. It features multi-page HTML/CSS frontend, email OTP authentication, a Supabase-backed API, and a lightweight admin dashboard — engineered to be clean, fast, and extensible.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🗂️ Project Structure](#%EF%B8%8F-project-structure)
- [⚡ Local Setup](#-local-setup)
- [☁️ Deploying to Vercel](#%EF%B8%8F-deploying-to-vercel)
- [🔌 API Reference](#-api-reference)
- [🛠️ Architecture Notes](#%EF%B8%8F-architecture-notes)
- [🤝 Contributing](#-contributing)
- [🏅 Credits & License](#-credits--license)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Email OTP Auth** | Secure signup & login with OTP verification sent via SMTP |
| 🗄️ **Supabase Backend** | PostgreSQL-powered persistent storage via `python/db.py` |
| ⚡ **Serverless on Vercel** | Python functions in `api/index.py` — scales automatically |
| 🖥️ **Multi-Page Frontend** | Full HTML/CSS UI: home, login, signup, plans, admin, account, forgot password |
| 🛡️ **Admin Dashboard** | Manage users and app data via `admin.html` / `admin2–4.html` |
| 📦 **Zero-Config Deploy** | Push to GitHub → live on Vercel in minutes |
| 🧩 **Modular Architecture** | Clean separation: frontend in `public/`, backend in `python/`, serverless in `api/` |

---

## 🗂️ Project Structure

```
foodelight/
│
├── 📁 api/
│   └── index.py               → Vercel serverless entry point
│
├── 📁 python/
│   ├── app.py                 → Flask application entry point
│   ├── config.py              → Environment and config loading
│   ├── common.py              → Shared helpers and utilities
│   ├── db.py                  → All DB connections (single source of truth)
│   ├── db_init.py             → Schema initialization
│   └── signup.py / login.py / forgot.py / ... → Route handlers
│
├── 📁 public/
│   ├── index.html             → Landing page
│   ├── login.html             → Login page
│   ├── login&signup.html      → Combined auth page
│   ├── acc.html               → User account page
│   ├── plan.html              → Subscription plans page
│   ├── forgot.html / forgot2.html   → Password recovery flow
│   ├── change.html / change2.html   → Password change flow
│   ├── logout.html / logout2.html   → Logout flow
│   ├── admin.html – admin4.html     → Admin dashboard pages
│   └── resources/
│       ├── css/               → Stylesheets (per-page + shared)
│       └── img/               → Images, icons, and SVGs
│
├── index.html                 → Root-level entry redirect
├── vercel.json                → Vercel routing & build config
├── requirements.txt           → Python dependencies
└── .gitignore                 → Excludes .env, .vercel/project.json, caches
```

---

## ⚡ Local Setup

> Get Foodelight running on your machine in under 5 minutes.

### 1 — Clone & Create a Virtual Environment

```bash
git clone https://github.com/subham146/food.git
cd food

python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2 — Configure Environment Variables

```bash
# Windows
copy python\.env.example python\.env

# macOS / Linux
cp python/.env.example python/.env
```

Open `python/.env` and fill in your credentials:

```env
DATABASE_URL=your_supabase_pooler_url?sslmode=require
FOODELIGHT_SMTP_HOST=smtp.yourprovider.com
FOODELIGHT_SMTP_PORT=587
FOODELIGHT_SMTP_USERNAME=your@email.com
FOODELIGHT_SMTP_PASSWORD=your_smtp_password
```

> ⚠️ **Never commit `.env` to version control.** It is already in `.gitignore`, but always double-check before pushing.

### 3 — Start the Flask Server

```bash
# Windows
set FLASK_APP=python/index.py
flask run --port 5000

# macOS / Linux
export FLASK_APP=python/index.py
flask run --port 5000
```

Visit **http://127.0.0.1:5000** — your local Foodelight is live.

---

## ☁️ Deploying to Vercel

> One push. Fully live. Zero drama.

### Step 1 — Set Environment Variables

In your Vercel Dashboard → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase pooler URL (with `?sslmode=require`) |
| `FOODELIGHT_SMTP_HOST` | Your SMTP host |
| `FOODELIGHT_SMTP_PORT` | `587` (or your provider's port) |
| `FOODELIGHT_SMTP_USERNAME` | Your email address |
| `FOODELIGHT_SMTP_PASSWORD` | Your SMTP password |

### Step 2 — Connect & Deploy

```bash
npm i -g vercel        # Install Vercel CLI
vercel link            # Link your project
vercel --prod          # Deploy to production
```

### Step 3 — Test Serverless Locally

```bash
vercel dev
# Visit http://localhost:3000
```

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/subham146/food)

</div>

---

## 🔌 API Reference

> **Important:** All API endpoints require the Flask backend server to be running (`flask run`). When testing locally, ensure the server is active before making requests. On Vercel, the serverless function handles this automatically.

### `POST /api/python/signup.py` — User Signup

Registers a new user and triggers an email OTP for verification.

```bash
curl -X POST "http://localhost:5000/api/python/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "name": "Your Name",
    "phone": "+10000000000"
  }'
```

**Success Response:**
```json
{
  "status": "success",
  "message": "OTP sent to your email"
}
```

**Note:** This endpoint sends a real email via your configured SMTP credentials. It will return an error if the backend server is not running or SMTP details are not set in `.env`.

---

### Quick Import Options

| Platform | How To |
|---|---|
| 🔵 **Replit** | Import from GitHub → paste repo URL → Run |
| 📦 **CodeSandbox** | Import from GitHub → instant browser IDE |
| ⚡ **Vercel** | Click the Deploy button above |

---

## 🛠️ Architecture Notes

**Key design decisions that make Foodelight reliable:**

**Single DB entry point** — all database access goes through `python/db.py`, making connection management centralized and easy to swap out.

**Automatic schema init** — `python/db_init.py` runs at route start to ensure tables exist, keeping deployments resilient. For high-traffic production, consider moving this to a one-time migration command.

**Stateless serverless functions** — `api/index.py` is designed for Vercel's stateless Python runtime, meaning it scales horizontally without any session state on the server.

**Secret hygiene** — `.env` is gitignored by default, and `.vercel/project.json` is excluded too. Neither should ever be committed.

**Frontend/backend separation** — all static pages and styles live under `public/resources/`, decoupled from the Python application logic.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

```bash
# 1. Fork the repository on GitHub

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit clearly
git commit -m "feat: describe what you added or fixed"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

**Guidelines:**
- Keep code clean, readable, and commented where necessary
- Never commit `.env` or `.vercel/project.json`
- Write tests where applicable
- Reference the relevant issue in your PR description

---

## 🏅 Credits & License

<div align="center">

Built with ❤️ and a lot of ☕ by **[@subham146](https://github.com/subham146)**

Contributions, issues, and feature requests are always welcome.

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:f39c12,100:e67e22&height=120&section=footer" width="100%"/>

</div>
