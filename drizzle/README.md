# Database migrations

Run `npm run db:generate` after schema changes, review the generated SQL, then apply with `npm run db:push` for controlled environments or the generated migration workflow for production.

Never run destructive schema changes against production without a backup and review.
