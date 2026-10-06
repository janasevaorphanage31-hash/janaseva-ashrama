# Safe database migration

The local database previously contained columns that the newer application schema did not declare. Running `drizzle-kit push` directly therefore offered destructive column drops.

For this project, `npm run db:sync` now performs a non-destructive SQL synchronization:

- adds missing columns with `IF NOT EXISTS`
- preserves existing `paused_at`, `updated_at`, `future_project`, and `accounting_approved`
- backfills `future_flag` and `finance_approval` from the legacy columns where possible
- never drops a column

Use:

```powershell
npm run db:sync
npm run typecheck
npm run build
```

`npm run db:push:unsafe` is retained only for deliberate developer use and must not be used against a database containing real data without a reviewed migration.
