# Discretion marketing site (GitHub Pages)

Static intake / marketing site for **Discretion** (adult relationship & infidelity investigations only).

## Live URL

After Pages is enabled for this repo:

`https://bbscalton.github.io/private-investigator/`

## Local preview

```bash
# from repo root
npx --yes serve website
```

## How Pages is deployed

GitHub Actions workflow `.github/workflows/pages.yml` publishes the contents of `website/` to GitHub Pages on every push to `main`.

## Updating the site

1. Edit files under `website/` (`index.html`, `styles.css`, `intake.js`, `assets/`).
2. Commit and push to `main`.
3. Wait for the **Deploy GitHub Pages** workflow to finish (Actions tab).
4. Hard-refresh the live URL.

Intake form opens a mailto draft and stores a local copy in the browser (`localStorage`). Full case creation stays in the authenticated Client app + Firestore (rules require a signed-in client). No Stripe on this site.
