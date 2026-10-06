# JANASEVA GiveA-inspired build QA — 2026-10-02

## Implemented
- Impact catalogue search and category filters.
- Today priority labels for admin-controlled impact items.
- Richer impact item metadata in the public catalogue.
- Donation FAQ for common donor questions.
- Pre-checkout Gift an Impact flow with recipient/occasion/message intent.
- Gift intent attached to the donation before payment.
- Gift card unlocked only after a verified paid donation.
- Gift readiness reflected on the verified receipt.
- Post-payment Impact Journey showing contribution → verification → impact record → future evidence.
- Homepage order retained around Today → Impact → Life → Verified Impact → Campaigns → Future → Transparency.
- CTA normalized to MAKE AN IMPACT.
- Server-side donation pricing now requires active, finance-approved impact items in production and respects start/end windows.

## Safety / integrity
- No GiveA branding, names or copied site text added.
- No unsupported impact claims were introduced.
- Demo payments never become verified impact or verified gifts.
- Public gift card requires a paid donation.
- Gift intents expire after 24 hours when not attached to a donation.

## Validation
- TypeScript/TSX syntax transpilation: PASS.
- Full `npm install`: blocked in this environment by package registry/network timeout; offline cache does not contain all dependencies.
- Full Next.js typecheck/build: must be run locally after `npm install`.
- PostgreSQL schema sync is required because `impact_gifts.donation_id` changes from required to nullable for pre-checkout gift intent.

## Local verification commands
1. `npm install`
2. `npm run db:sync`
3. `npm run typecheck`
4. `npm run build`
5. `npm run dev`

Then test `/gift-impact`, `/impact`, `/checkout`, and a verified `/receipt/<publicId>` flow.
