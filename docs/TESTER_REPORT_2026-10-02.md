# JANASEVA ASHRAMA — Tester Report

## Test scope
Reviewed the DB-fix ZIP statically and traced the two runtime failures shown in the supplied localhost screenshots.

## Confirmed fixes
- `src/lib/content.ts` now applies Impact Item finance filtering in the Drizzle `where(...)` clause instead of calling JavaScript `.filter()` on the query builder.
- Campaign queries reference the new `campaigns.end_date` field; the local PostgreSQL database must be synchronized with `npm run db:sync`.

## Additional bugs found and fixed in this pass
1. Public Company/Creator/NGO Partner POST endpoints were returning inserted database rows, including private contact fields. Responses now return only a minimal identifier/slug.
2. Non-Finance admins could request `financeApproval=approved` on Impact Items. Only `FINANCE` and `SUPER_ADMIN` can now change finance approval; other roles are forced to `pending` on create and receive HTTP 403 when attempting to change approval.

## Test limitations
- Full `npm install` could not complete in this environment within the available execution window.
- Therefore a clean `next build`, full TypeScript check with project dependencies, and live PostgreSQL integration test could not be completed here.
- The screenshot's PostgreSQL `end_date` error remains a database-state issue until the user's local DB runs `npm run db:sync`.

## Next runtime test
1. `npm install`
2. `npm run db:sync`
3. `npm run dev`
4. Verify `/` loads without server errors.
5. Verify `/admin` redirects to `/admin/login` when unauthenticated.
6. Verify `/admin/content` works after login.
7. Verify campaign list loads without `end_date` errors.
8. Verify Impact Items load without `.filter is not a function`.
9. Verify a non-Finance admin cannot approve an Impact Item.
10. Verify public Company/Creator/Partner submissions do not return private contact data.
