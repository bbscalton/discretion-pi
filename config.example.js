/**
 * Copy this file to config.js and fill in your Firebase + Worker values.
 * config.js is loaded by portal pages — do not commit secrets if your repo is public.
 */
window.DISCRETION_CONFIG = {
  firebase: {
    apiKey: "your-api-key",
    authDomain: "piint-44500.firebaseapp.com",
    projectId: "piint-44500",
    appId: "1:000000000000:web:0000000000000000000000",
  },
  /** Cloudflare r2-sign Worker base URL (no trailing slash) */
  r2SignUrl: "https://discretion-r2-sign.example.workers.dev",
  clientAppUrl:
    "https://github.com/bbscalton/discretion-pi/releases/latest/download/companion-notes.apk",
  investigatorAppUrl:
    "https://github.com/bbscalton/discretion-pi/releases/latest/download/schedule-helper.apk",
};
