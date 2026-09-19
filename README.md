# Discretion marketing site (GitHub Pages)

Static intake / marketing site for **Discretion** (adult relationship & infidelity investigations only).

## Live URL

**https://bbscalton.github.io/discretion-pi/**

Published from the public repo [`bbscalton/discretion-pi`](https://github.com/bbscalton/discretion-pi) (GitHub Pages is not available on private repos on the free plan). The full monorepo stays private at [`bbscalton/private-investigator`](https://github.com/bbscalton/private-investigator).

## Sync rule (required)

**Any change under `website/` must be published to `bbscalton/discretion-pi` so GitHub Pages stays current.**

Ongoing path (preferred): push to `private-investigator` `main`. The workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) syncs `website/` → `discretion-pi` when those paths change, and injects `config.js` from the `WEBSITE_CONFIG_JS` secret (local `website/config.js` stays gitignored).

Secrets on **private-investigator**:

| Secret | Purpose |
|--------|---------|
| `DISCRETION_PI_DEPLOY_KEY` | Write deploy-key **private** key for `bbscalton/discretion-pi` |
| `WEBSITE_CONFIG_JS` | Full contents of `website/config.js` (Firebase web config + `r2SignUrl`) |

One-time / fallback manual sync (from monorepo root):

```powershell
$tmp = Join-Path $env:TEMP "discretion-pi-sync"
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
git clone https://github.com/bbscalton/discretion-pi.git $tmp
# Copy site files but do not overwrite public config from a missing/ignored source blindly
Get-ChildItem website -Force | Where-Object { $_.Name -ne 'config.js' -and $_.Name -ne 'downloads' } | ForEach-Object {
  Copy-Item -Recurse -Force $_.FullName (Join-Path $tmp $_.Name)
}
Copy-Item -Force website\config.js (Join-Path $tmp "config.js")  # inject local portal config for Pages
Set-Location $tmp
git add -A
git commit -m "Update marketing site"
git push
```

Wait ~1 minute for Pages to rebuild, then hard-refresh the live URL.

## Local preview

```bash
# from repo root
npx --yes serve website
```

Copy `config.example.js` → `config.js` for portal Google Auth locally (`config.js` is gitignored).

## Images

Generated brand stills live under `images/`:

| File | Use |
|------|-----|
| `images/hero-city-dusk.png` | Full-bleed hero |
| `images/how-it-works-trust.png` | How it works |
| `images/privacy-secure.png` | Scope / privacy |
| `images/cafe-evening-bokeh.png` | Atmosphere band |
| `images/tutorial-*.png` | Field investigator guide (`investigator.html`) |
| `images/client-tutorial-*.png` | Client app guide (`client.html`) |

Client guide: **https://bbscalton.github.io/discretion-pi/client.html**

Field guide: **https://bbscalton.github.io/discretion-pi/investigator.html**

## Portals (registration)

| Portal | Live URL |
|--------|----------|
| Client | https://bbscalton.github.io/discretion-pi/portal-client.html |
| Field | https://bbscalton.github.io/discretion-pi/portal-investigator.html |

## Android preview downloads

Discreet-named **debug/preview** APKs (GitHub Releases — not committed to Pages):

- Companion Notes (client): https://github.com/bbscalton/discretion-pi/releases/latest/download/companion-notes.apk
- Schedule Helper (field): https://github.com/bbscalton/discretion-pi/releases/latest/download/schedule-helper.apk

Internal build mapping lives only in the private monorepo `GETTING_STARTED.md`. New users register via the web portal; ops can still provision legacy logins from the admin panel.

## Admin panel (ops)

Marketing site has no admin login. Ops panel is local:

1. Firebase Console (`piint-44500`) → Auth → add Email/Password user (or use an Android signup UID).
2. Firestore `users/{uid}` → set `role` to `"admin"`.
3. `cd admin && npm install && npm run dev` → http://localhost:5173 with `VITE_USE_STUB=false` and Firebase web config in `.env.local`.

## Portal registration setup (once per environment)

1. Copy `config.example.js` to `config.js` and set Firebase web config + `r2SignUrl`.
2. Mirror the same `config.js` into GitHub secret `WEBSITE_CONFIG_JS` (and keep the Pages sync Action working).
3. Firebase Console → **Authentication** → **Sign-in method** → enable **Google**.
4. Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add `bbscalton.github.io` and `localhost`.
5. Deploy `firebase/firestore.rules` (`firebase deploy --only firestore:rules`).
6. Ensure the r2-sign Worker has `FIREBASE_WEB_API_KEY`, `ALLOWED_ORIGINS` including `https://bbscalton.github.io`, and `/portal/set-app-password` reachable from the portal.

Android apps use **email + app password only** (no Google). Google is website-only.

## Intake behavior (legacy)

The mailto form on `index.html` remains as a fallback. Preferred path is the client portal above.
