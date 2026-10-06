# JANASEVA ASHRAMA — All Plan Implementation Pass

This pass maps the client project report's P0-P5 roadmap onto the current codebase. The client report defines P0 Foundation, P1 Experience, P2 Giving, P3 Growth, P4 Community and P5 Scale. It also requires mobile-first UX, no-code administration, campaigns, CSR, NGO collaboration, safeguarding and verified impact.

## Implemented in this pass
- Corporate / CSR public enquiry flow
- Team Impact public journey and campaign entry point
- Janaseva Crew dedicated volunteer page
- Give Your Skill pathway
- NGO Network public partnership request pathway
- Proposed Future Campus page
- My Impact receipt-reference entry point
- Regular Giving interest flow (does not create automatic charges)
- PWA manifest/installability foundation
- Mobile More navigation exposes the new pathways
- Corporate link in desktop header
- Existing campaign engine remains the shared engine for personal/team/creator/community campaigns

## Already present before this pass
- Cinematic home
- Today at Janaseva
- Today's Needs / Impact Cart
- Razorpay foundation and webhook verification
- Receipts
- Impact Wall
- Make a Day Matter
- Gift an Impact pre-checkout intent
- Campaign moderation and verified progress
- Volunteer pipeline
- Admin foundation / RBAC / audit logs
- Media consent data model
- Future project separation

## Still dependent on production integration / verification
- Automatic recurring Razorpay subscriptions: requires provider subscription configuration and production credentials; the public page deliberately records interest instead of silently charging.
- Real object-storage/CDN media processing and malware scanning: data model exists; provider wiring remains environment-specific.
- WhatsApp Business impact notifications: requires approved provider/account and consent workflow.
- Advanced CRM and deep analytics: platform event collection exists; dashboards/export automation need production data and reporting requirements.
- Native app: PWA foundation added; native app remains a later option.
- Foreign-contribution workflows: must be legally reviewed and isolated from domestic payment flow.
- Tax/80G wording: publish only from current verified documents.
- Actual programme categories, addresses, social handles and impact accounting definitions: require Ashrama confirmation.

## Additional community/admin pass
- Creator Campaigns now has an actual onboarding form and uses the existing campaign engine for campaign creation.
- Protected Admin Community page now surfaces corporate, creator, NGO partner and regular-giving requests.
- Regular-giving safe migration now creates its table without dropping existing columns.
- My Impact reference entry now redirects to the existing verified receipt route correctly.
