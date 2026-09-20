# Discretion marketing site (GitHub Pages)

Static intake / marketing site for **Discretion** (adult relationship & infidelity investigations only).

## Live URL

**https://bbscalton.github.io/discretion-pi/**

| Page | URL |
|------|-----|
| Home | https://bbscalton.github.io/discretion-pi/ |
| Pricing (GYD) | https://bbscalton.github.io/discretion-pi/pricing.html |
| Earn (field) | https://bbscalton.github.io/discretion-pi/earn.html |
| Client guide | https://bbscalton.github.io/discretion-pi/client.html |
| Field guide | https://bbscalton.github.io/discretion-pi/investigator.html |
| Learn | https://bbscalton.github.io/discretion-pi/learn.html |

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
Get-ChildItem website -Force | Where-Object { $_.Name -ne 'config.js' -and $_.Name -ne 'downloads' } | ForEach-Object {
  Copy-Item -Recurse -Force $_.FullName (Join-Path $tmp $_.Name)
}
Copy-Item -Force website\config.js (Join-Path $tmp "config.js")
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

## Pricing (public)

All public prices are in **Guyanese dollars (GYD)**. Clients pay after case-manager unlock (invoice); no public Stripe required for this pass. Field earnings: 60% investigator / 40% platform — see `earn.html`.

## Android preview downloads

Discreet-named **debug/preview** APKs (GitHub Releases — not committed to Pages):

- Companion Notes (client): https://github.com/bbscalton/discretion-pi/releases/latest/download/companion-notes.apk
- Schedule Helper (field): https://github.com/bbscalton/discretion-pi/releases/latest/download/schedule-helper.apk

## Portals (registration)

| Portal | Live URL |
|--------|----------|
| Client | https://bbscalton.github.io/discretion-pi/portal-client.html |
| Field | https://bbscalton.github.io/discretion-pi/portal-investigator.html |

## Portal registration setup (once per environment)

1. Copy `config.example.js` to `config.js` and set Firebase web config + `r2SignUrl`.
2. Mirror the same `config.js` into GitHub secret `WEBSITE_CONFIG_JS`.
3. Enable Google sign-in and authorize `bbscalton.github.io` + `localhost` in Firebase Auth.
4. Deploy Firestore rules; ensure the r2-sign Worker allows the Pages origin.

Android apps use **email + app password only** (no Google). Google is website-only.

## Intake behavior (legacy)

The mailto form on `index.html` remains as a fallback. Preferred path is the client portal above.
