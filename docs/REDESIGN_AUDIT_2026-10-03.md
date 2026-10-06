# JANASEVA ASHRAMA — Indian Audience UX & Psychology Redesign Audit

## Objective
Make the website understandable in seconds on mobile, emotionally human without guilt, and conversion-friendly without dark patterns.

## Research observations
- GiveA makes giving concrete: cause -> basket -> customise -> secure checkout -> impact update. It also emphasizes real photos/videos and dignity. Source: https://givea.in/pages/our-impact
- Akshaya Patra makes donation choices concrete and puts programme-specific amounts and donation frequency directly into the giving flow. Source: https://www.akshayapatra.org/act-of-giving
- Goonj combines campaigns, progress, contributor counts, and impact evidence with donation guidance. Source: https://goonj.org/donate/
- CRY provides multiple Indian payment methods and prominent security/tax/trust cues. Source: https://www.cry.org/donate-online/
- Smile Foundation explains what a contribution supports before asking for the donation and uses a small set of amount choices. Source: https://www.smilefoundationindia.org/donation/

## Janaseva adaptation
We do not copy these brands. We adapt the useful interaction patterns to Janaseva's own identity:

SEE -> UNDERSTAND -> CHOOSE -> CONTRIBUTE -> VERIFY -> SEE IMPACT

## Homepage order
1. Cinematic story, with a visible skip path.
2. Immediate three-choice decision block.
3. Today at Janaseva.
4. What can you make possible? / Your Impact.
5. Life at Janaseva.
6. Verified impact.
7. Create an Impact / Make a Day Matter.
8. Proposed future project.
9. Transparency.
10. Contact.

## Copy rules
- Use short sentences and concrete nouns.
- Do not use guilt, shame, fake urgency, fake scarcity, fake social proof, or invented impact numbers.
- Never imply that a donation guarantees a specific outcome unless the finance/operations definition supports it.
- Children are represented through dignity, everyday life, learning, friendship and growth — not pity.
- Every CTA tells the visitor what happens next.

## Visual system
- Deep teal: trust, calm, institutional credibility.
- Warm marigold: action and warmth, used sparingly for primary CTAs.
- Warm cream/sand: human, editorial background.
- Gold: small emphasis/progress accent.
- White: clarity for cards and forms.

## Floating actions
The mobile floating action contains only Make an Impact, Call and WhatsApp. Social media is not placed in the floating action.
Social links appear only when real official URLs are configured.

## Safety/trust constraints
- No guessed map location.
- No placeholder social links.
- Published transparency documents only.
- Future campus clearly labelled proposed.
- Verified payment/impact language only.
- Demo content must not appear as real impact.

## Current implementation corrections
- Activated the previously unused QuickDecisionSection on the homepage.
- Reduced cinematic height to shorten the mobile journey while retaining scroll storytelling.
- Simplified the first-screen copy to: "See the home. Understand the need. Then choose your way to be part of it."
- Simplified desktop navigation to the core public journey.
- Removed social links from the floating mobile action.
- Removed the unverified public map from Contact.
- Reworked Contact copy around verified visit information.
- Adjusted the colour tokens toward a warmer Indian editorial palette.
- Tightened Life-at-Janaseva wording to avoid presenting unverified operational claims as facts.

## Still required before production
- Real Ashrama media and cinematic assets.
- Final finance-approved impact-unit definitions.
- Verified current legal/tax publication set.
- Real official social URLs if the Ashrama wants them published.
- Verified operating address before publishing a map.
- Full media consent/review/takedown workflow.
- Production authentication/RBAC and payment webhook testing.
