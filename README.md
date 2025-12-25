# Summit

## Deploying to Vercel

1. Create a new Vercel project and import this repository.
2. Add the environment variables from `.env.example` in the Vercel dashboard.
   - Make sure `DATABASE_URL`/`DIRECT_URL` point to a production Postgres instance (Vercel Postgres or your own).
   - Provide SMTP credentials so OTP emails can be delivered (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
3. Enable **Web Analytics** and **Speed Insights** for the project so the instrumentation scripts served from `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` collect data in production.
4. Push to the main branch or trigger a deployment; Vercel will run `npm run build` automatically.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the required secrets before running the app locally.
