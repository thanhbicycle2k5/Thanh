# Task2Goal-TBicycle# Deploy trigger

## Server-side reminders

Reminders use Web Push, `public/custom-sw.js`, Firestore, and the server endpoint under `api/`. The notification title and body are rendered from the existing Task2Goal builders and are stored with each reminder, so closing the tab does not change the configured notification content.

Set these Vercel environment variables:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:your-email@example.com
FIREBASE_SERVICE_ACCOUNT_JSON
CRON_SECRET
```

Generate VAPID keys locally without a paid service:

```bash
npx web-push generate-vapid-keys
```

`VAPID_PRIVATE_KEY`, the Firebase service account, and `CRON_SECRET` are server-only. The app exposes only the public VAPID key through `/api/push/config`.

Vercel Cron is configured for every minute. Vercel Hobby may restrict cron frequency; for a $0 deployment, configure the repository's scheduled GitHub Action with the `CRON_SECRET` repository secret. Its normal cadence is every five minutes and GitHub may delay scheduled jobs, so exact-minute delivery requires a scheduler plan that supports per-minute execution.
