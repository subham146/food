<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5a4,100:ff6b6b&height=200&section=header&text=🍽️%20Foodelight&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Where%20Flavor%20Meets%20Function&descAlignY=58&descSize=22&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=0EA5A4&center=true&vCenter=true&width=600&lines=Full-Stack+Food+App+🍕;Flask+%2B+Vercel+Serverless+⚡;Demo-Ready+%26+Deployable+🚀;Open+Source+%26+Extensible+🌱)](https://git.io/typing-svg)

<br/>

<a href="https://foodelight-24223088.vercel.app">
  <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-0ea5a4?style=for-the-badge&labelColor=0f172a" />
</a>
&nbsp;
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white&labelColor=0f172a" />
&nbsp;
<img src="https://img.shields.io/badge/Flask-4.0-ff6b6b?style=for-the-badge&logo=flask&logoColor=white&labelColor=0f172a" />
&nbsp;
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0f172a" />
&nbsp;
<img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=0f172a" />

<br/><br/>

> **Foodelight** is a sleek, serverless Flask application built for Vercel — featuring user authentication, OTP flows, DB-backed features, and a lightweight admin panel. Built to impress, designed to scale.

<br/>

---

</div>

## 🗺️ Navigate the Flavors

<div align="center">

| 🔗 Section | 🔗 Section | 🔗 Section |
|:---:|:---:|:---:|
| [✨ What's Cooking?](#-whats-cooking) | [🎨 The Visual Recipe](#-the-visual-recipe) | [⚡ From Zero to Running](#-from-zero-to-running) |
| [☁️ Deploy to the Cloud](#%EF%B8%8F-deploy-to-the-cloud) | [🧪 Playground & Curl Shots](#-playground--curl-shots) | [🛠️ Under the Hood](#%EF%B8%8F-under-the-hood) |
| [🤝 Join the Kitchen](#-join-the-kitchen) | [🏅 Credits & License](#-credits--license) | |

</div>

---

## ✨ What's Cooking?

Foodelight isn't just another CRUD app — it's a **production-grade serverless food platform** that demonstrates real-world patterns developers actually use:

<div align="center">

| Feature | Description |
|---|---|
| 🔐 **Auth & OTP Flows** | Secure signup with email-based OTP verification |
| 🗄️ **DB-Backed API** | Supabase + PostgreSQL for persistent, scalable storage |
| ⚡ **Serverless Ready** | Runs natively on Vercel Python Functions |
| 🖥️ **Admin Panel** | Lightweight dashboard for managing app data |
| 📦 **Zero Config Deploy** | Push to GitHub → live in minutes |
| 🧩 **Extensible Architecture** | Modular Flask structure, easy to expand |

</div>

---

## 🎨 The Visual Recipe

Every pixel of Foodelight is intentional. Here's the design DNA:

<div align="center">

```
╔══════════════════════════════════════════════╗
║           FOODELIGHT COLOR PALETTE           ║
╠══════════════════════════════════════════════╣
║  🟦 Teal       →   #0ea5a4   (Primary)       ║
║  🟥 Coral      →   #ff6b6b   (Accent)        ║
║  ⬛ Deep Slate →   #0f172a   (Background)    ║
╚══════════════════════════════════════════════╝
```

</div>

Use these in your screenshots, banners, and SVGs for a fully **consistent brand identity**.

---

## ⚡ From Zero to Running

> Get the full Foodelight experience on your machine in under 5 minutes.

### Step 1 — Clone & Set Up Your Environment

```powershell
# Clone the repo
git clone https://github.com/subham146/food.git
cd food

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install all dependencies
pip install -r requirements.txt
```

### Step 2 — Configure Your Secrets 🔑

```powershell
# Copy the example env file
copy python\.env.example python\.env
```

Then open `python\.env` and fill in your values:

```env
DATABASE_URL=your_supabase_pooler_url?sslmode=require
FOODELIGHT_SMTP_HOST=smtp.yourprovider.com
FOODELIGHT_SMTP_PORT=587
FOODELIGHT_SMTP_USERNAME=your@email.com
FOODELIGHT_SMTP_PASSWORD=your_smtp_password
```

> ⚠️ **Never commit `.env` to git** — it's already in `.gitignore`, but stay vigilant!

### Step 3 — Fire It Up 🔥

```powershell
set FLASK_APP=python/index.py
flask run --port 5000
```

🎉 Visit **http://127.0.0.1:5000** and enjoy your local Foodelight!

---

## ☁️ Deploy to the Cloud

> One push. Fully live. Zero drama.

### Vercel Serverless Deployment

**1. Set Environment Variables** in your Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL          →  Your Supabase pooler URL (?sslmode=require)
FOODELIGHT_SMTP_HOST  →  Your SMTP host
FOODELIGHT_SMTP_PORT  →  587 (or your provider's port)
FOODELIGHT_SMTP_USERNAME → Your email
FOODELIGHT_SMTP_PASSWORD → Your SMTP password
```

**2. Connect & Deploy:**

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Deploy to production
vercel --prod
```

**3. Test serverless locally before deploying:**

```bash
vercel dev
# Visit http://localhost:3000
```

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/subham146/food)

</div>

---

## 🧪 Playground & Curl Shots

> Poke the API. Break things. Learn how it works.

### Signup Endpoint

```bash
curl -X POST "http://localhost:3000/api/python/signup.py" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "name": "Dev Tester",
    "phone": "+10000000000"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "OTP sent to your email"
}
```

### Quick Import Options

| Platform | Action |
|---|---|
| 🔵 **Replit** | Import from GitHub → paste repo URL → Run |
| 📦 **CodeSandbox** | Import from GitHub → instant browser IDE |
| ⚡ **Vercel** | Click the Deploy button above |

---

## 🛠️ Under the Hood

> Architecture decisions that make Foodelight tick.

```
food/
├── 📁 python/
│   ├── 🗄️  db.py          → All DB connections via DATABASE_URL
│   ├── 🏗️  db_init.py     → Schema initialization (auto-runs on route start)
│   ├── 🔑  index.py       → Main Flask app entry point
│   └── 🔒  .env           → Your secrets (never committed)
├── 📁 api/
│   └── ⚡  index.py       → Vercel serverless function entry
├── 📄  requirements.txt   → Python dependencies
├── 📄  .gitignore         → Keeps secrets out of git
└── 📄  README.md          → You are here 📍
```

**Key Design Decisions:**
- 🔗 All DB access goes through `python/db.py` — single source of truth
- 🏁 Schema init happens at route start — resilient but can be moved to a maintenance command for production
- 🔒 `.env` is pre-gitignored — secrets stay local
- ☁️ Vercel functions are stateless — designed for horizontal scale

---

## 🤝 Join the Kitchen

> Great software is a team recipe. Every contribution makes it better.

```bash
# 1. Fork the repo on GitHub
# 2. Create your feature branch
git checkout -b feature/your-amazing-feature

# 3. Make your changes & commit with clarity
git commit -m "feat: add your amazing feature"

# 4. Push and open a PR
git push origin feature/your-amazing-feature
```

**Contribution Guidelines:**
- 🧹 Keep code clean and commented
- 🔒 Never commit `.env` or `.vercel/project.json`
- ✅ Add tests if applicable
- 📝 Reference the issue in your PR description

---

## 🏅 Credits & License

<div align="center">

Made with ❤️ and a lot of ☕ by **[@subham146](https://github.com/subham146)**

Contributions are always welcome — open an issue, start a discussion, or send a PR!

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff6b6b,100:0ea5a4&height=100&section=footer" width="100%"/>

</div>
