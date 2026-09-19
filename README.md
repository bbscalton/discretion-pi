# Discretion marketing site (GitHub Pages)

Static intake / marketing site for **Discretion** (adult relationship & infidelity investigations only).

## Live URL

**https://bbscalton.github.io/discretion-pi/**

Published from the public repo [`bbscalton/discretion-pi`](https://github.com/bbscalton/discretion-pi) (GitHub Pages is not available on private repos on the free plan). The full monorepo stays private at [`bbscalton/private-investigator`](https://github.com/bbscalton/private-investigator).

## Local preview

```bash
# from repo root
npx --yes serve website
```

## Updating the site

1. Edit files under `website/` in the private monorepo (`index.html`, `styles.css`, `intake.js`, `assets/`).
2. Commit and push to `private-investigator` `main`.
3. Sync the public Pages repo:

```powershell
# from monorepo root
$tmp = Join-Path $env:TEMP "discretion-pi-sync"
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
git clone https://github.com/bbscalton/discretion-pi.git $tmp
Copy-Item -Recurse -Force website\* $tmp
Set-Location $tmp
git add -A
git commit -m "Update marketing site"
git push
```

4. Wait ~1 minute for Pages to rebuild, then hard-refresh the live URL.

Alternatively, push website contents directly to `discretion-pi` `main` (site root = Pages root).

## Intake behavior

Form opens a mailto draft and stores a local copy in the browser (`localStorage`). Full case creation stays in the authenticated Client app + Firestore (rules require a signed-in client). No Stripe on this site — admin unlocks manually.
