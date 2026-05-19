<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="140" viewBox="0 0 1200 140" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#0ea5a4"/>
      <stop offset="1" stop-color="#ff6b6b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="140" fill="url(#g)" rx="10"/>
  <g font-family="Helvetica, Arial, sans-serif" font-weight="700">
    <text x="40" y="86" font-size="54" fill="#fff">Foodelight</text>
    <text x="40" y="112" font-size="18" fill="#fff">Delightful food app — demo-ready, deployable, and extensible</text>
  </g>
</svg>

# Foodelight — interactive, themed, and ready-to-run

> Live demo: [Open live demo](https://foodelight-24223088.vercel.app) (replace with your production URL)

![Vercel](https://img.shields.io/badge/deploy-on-Vercel-000000?style=for-the-badge&logo=vercel)
![Python](https://img.shields.io/badge/python-3.11-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/flask-4.0-9cf?style=for-the-badge&logo=flask)

Quick, interactive README with collapsible sections, themed banner, and runnable snippets.

<details>
<summary><strong>Quick links</strong></summary>

- Live site: https://foodelight-24223088.vercel.app
- Vercel project: Open via your Vercel dashboard
- Local env: `python/.env` (kept out of git; see `.gitignore`)

</details>

## Table of contents

- [About](#about)
- [Theme & Colors](#theme--colors)
- [Quick start (local)](#quick-start-local)
- [Run the app](#run-the-app)
- [Deploy (Vercel)](#deploy-vercel)
- [Interactive options](#interactive-options)
- [Development notes](#development-notes)
- [Contributing](#contributing)
- [Credits & License](#credits--license)

## About

Foodelight is a small Flask-based serverless app (designed for Vercel functions) that demonstrates user flows, simple DB-backed features, and a lightweight admin panel. This README focuses on making it dead-simple to run, test, and play with.

## Theme & Colors

Primary palette used in the repo (suitable for IDE and site accents):

- Teal: `#0ea5a4`  
- Coral: `#ff6b6b`  
- Deep slate: `#0f172a`

Use these in screenshots, banners, and SVGs for a consistent look.

## Quick start (local)

1. Create a Python virtual environment and activate it.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy environment example (do not commit secrets):

```powershell
copy python\.env.example python\.env
# Edit python\.env and set DATABASE_URL and FOODELIGHT_SMTP_* etc.
```

3. Run locally (development server):

```powershell
set FLASK_APP=python/index.py
flask run --port 5000
# or run the equivalent script in Windows PowerShell/Terminal
```

Open http://127.0.0.1:5000 to interact.

## Run the app (Vercel functions)

The API endpoints live under `python/` and are exposed by `api/index.py` for serverless deployment. To test serverless behavior locally consider using the Vercel CLI or `vercel dev`.

```bash
vercel dev
# then visit http://localhost:3000/api/python/signup.py
```

## Deploy (Vercel)

1. Ensure your Vercel project has the following Environment Variables set (Production):

- `DATABASE_URL` (use Supabase pooler URL with `?sslmode=require`)
- `FOODELIGHT_SMTP_HOST`
- `FOODELIGHT_SMTP_PORT`
- `FOODELIGHT_SMTP_USERNAME`
- `FOODELIGHT_SMTP_PASSWORD`
- `FOODELIGHT_SECRET_KEY`

2. Link your repository to Vercel and set the build/deploy settings to run Python serverless functions. Then push to your main branch — Vercel will auto-deploy.

## Interactive options

- Open the live demo (if deployed): [Live demo](https://foodelight-24223088.vercel.app)
- Try a one-click import to Replit or CodeSandbox: use "Import from GitHub" on those services and start the environment there.
- Use the Vercel CLI for a fast local serverless dev loop: `vercel dev`.

### Playground snippets

You can run quick curl requests to exercise endpoints (replace example data):

```bash
curl -X POST "http://localhost:3000/api/python/signup.py" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"Dev Tester","phone":"+10000000000"}'
```

Expect a JSON response with status or OTP workflow messages.

## Development notes

- All DB connectivity goes through `python/db.py` using `DATABASE_URL`.
- Schema initialization happens in `python/db_init.py` and is called at route start; if you want resilience, delay schema-init to a maintenance command.
- Keep `python/.env` out of git; `.gitignore` is pre-configured.

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Run tests (if added) and add clear commit messages.
4. Open a PR and reference the issue.

Please avoid committing secrets or `.vercel/project.json`.

## Credits & License

Made with ❤️ — contributions welcome.

Licensed under MIT. See `LICENSE`.

---

If you want the README to be more interactive (live SVG controls, embedded demos, or a dedicated `README.html` with JavaScript), tell me which features you want and I will add them — I can also commit and push the change for you.
