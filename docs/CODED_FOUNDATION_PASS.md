# Janaseva Ashrama — Coded Foundation Correction Pass

This pass corrects the highest-risk issues identified during the codebase audit before adding more V2 features.

## Implemented

- Added role-aware `requireAdminApi()` and applied it to mission/company/creator/partner admin reads and mission mutations.
- Added audit logging for mission creation and updates.
- Certificates now require a real `paid` donation; demo payments cannot generate public certificates.
- Gift cards now require a real `paid` donation; demo payments cannot generate public gift cards.
- Mission progress reads `mission_contributions.allocated_amount` rather than summing the full donation amount.
- Removed the unverified "SUPPORT A CHILD NOW" CTA; primary CTA is now `MAKE AN IMPACT`.
- Removed fixed donation bundle presets from the Impact Cart. Users choose approved impact items or a custom amount.
- Corrected homepage flow by removing the duplicate story block from the homepage; Our Story remains a dedicated page.
- Removed unfinished V2 Corporate/Creator/Partner/Missions links from primary header/mobile/footer navigation while keeping their routes available for later implementation.
- Hidden placeholder Instagram/Facebook links until real URLs are configured.
- Demo impact items are allowed only when `ALLOW_DEMO_SEED=true`; production only exposes finance-approved impact items.
- Added `db:migrate` script to the package scripts.

## Still intentionally NOT marked complete

- Full no-code CMS/media upload workflow
- Object storage/CDN processing
- Complete safeguarding reviewer UI
- Full donation state machine (pending/failed/expired/disputed/refund reconciliation)
- Proper pre-checkout Gift an Impact flow
- Mission allocation UI/workflow
- Complete admin CRUD screens
- Production database migration files
- Production Razorpay credentials/configuration
- Real Janaseva photos/videos
- Current verified social accounts
- Actual Ashrama operating address

These remain the next implementation stages. Do not treat the current V2 placeholder routes as production-ready.

## Validation note

The source package dependencies are not installed in this workspace, and the package installation attempt timed out. Therefore a full Next.js typecheck/lint/build could not be executed here. The changed source was inspected for syntax and the project is packaged for the next local/CI validation step.
