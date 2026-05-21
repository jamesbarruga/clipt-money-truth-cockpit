# Clipt Care Money Truth Cockpit

Clickable Vite + React + Tailwind prototype for a finance-ops / reconciliation cockpit.

## What this demo shows

This is a self-contained presentation prototype for mapping:

- Clipt Care client visits
- provider/nurse payouts
- kits and training fees
- provider subscriptions
- Stripe charges, invoices, payouts, transfers, refunds
- US Bank deposits
- admin-site data gaps
- deterministic automation vs AI-assisted review

It uses fake/sample data only.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually:

```bash
http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Deploy options

### Vercel / Netlify

Import this GitHub repo and deploy as a Vite app.

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

### GitHub Pages

This repo includes `.github/workflows/deploy.yml`.

In GitHub:
1. Push the repo.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Push to `main`.
5. Wait for the action to finish.
6. Your demo will be live on GitHub Pages.

## Notes

This is a prototype only, not final accounting/tax software. It should be described as a visual workflow and reconciliation concept, not as production-ready bookkeeping software.
