# JANASEVA ASHRAMA — local database sync

The application code now uses the current Drizzle schema, including campaign `end_date` and expanded impact-item fields.

If the browser shows a PostgreSQL error such as `column campaigns.end_date does not exist`, the local database is simply behind the current schema.

## Fix

1. Stop the dev server with `Ctrl+C`.
2. Confirm `.env.local` contains the correct `DATABASE_URL` for the Janaseva local database.
3. Run:

```bash
npm install
npm run db:sync
npm run dev
```

`db:sync` uses the same `DATABASE_URL` as the application and applies the current Drizzle schema to the local database.

Do **not** manually edit PostgreSQL tables to fix this error.

## What the sync is addressing

The recent foundation pass added/changed database fields for:
- campaign end dates and moderation fields
- expanded impact-item metadata and finance approval
- campaign members
- mission contribution allocation
- gift/certificate foundations
- volunteer pipeline
- audit/security foundations

Always back up a production database before applying schema changes. Use generated Drizzle migrations for production deployment rather than relying on `push`.
