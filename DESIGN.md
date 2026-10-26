---
name: Janaseva Ashrama Design System
description: Dignified, sacred, and warm visual language for Indian grassroots child welfare and donor psychology
colors:
  primary: "#052f2c"
  primary-deep: "#031c1a"
  primary-dark: "#042825"
  primary-mid: "#0a403d"
  primary-light: "#0f554f"
  primary-teal-700: "#1a6b63"
  primary-teal-100: "#d6ebe8"
  accent-saffron: "#d97924"
  accent-saffron-dark: "#a95018"
  accent-amber: "#f59e0b"
  accent-gold: "#e8b34a"
  surface-cream: "#fcf8f1"
  surface-sand: "#f4ead8"
  surface-card: "#ffffff"
  text-heading: "#052f2c"
  text-body: "#1c2b2a"
  text-muted: "#5a706e"
typography:
  display:
    fontFamily: "Georgia, Cambria, 'Times New Roman', serif"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  btn: "0.875rem"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent-saffron}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.accent-saffron-dark}"
  card-donation:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Janaseva Ashrama Design System

## Overview

The Janaseva Ashrama design system bridges authentic Indian spiritual devotion with world-class digital conversion design. Engineered to support the care of 25 resident boys, the design creates an immediate atmosphere of credibility, sanctity, warmth, and transparent stewardship. 

Every surface is tuned for high-conversion donor psychology—optimizing specifically for mobile donors arriving via Meta Ads (Instagram/Facebook) and Google Ads who seek an immediate, secure, and meaningful way to sponsor meals or celebrate birthdays.

## Colors

The palette draws inspiration from sacred temple architecture, fresh annadana feasts, and traditional Indian saffron dyes.

### Palette Architecture
- **Sacred Forest Teal (`#052f2c`, `#0a3f3b`, `#0f554f`):** Anchors trust, stability, and enduring institutionhood. Used for headings, primary navigation, footers, and foundational contrast.
- **Temple Saffron (`#d97924`, `#a95018`):** The primary call-to-action and energy color. Represents selfless service (*Seva*), auspicious celebration, and warmth. Used for donation amounts, primary buttons, and milestone badges.
- **Auspicious Gold (`#e8b34a`):** Used sparingly for 80G tax benefit highlights, verified government seals, and celebration banners.
- **Warm Sand & Cream (`#fcf8f1`, `#f4ead8`):** Organic background canvas that eliminates stark, clinical white and makes reading relaxed and inviting.

### Anti-Pattern Rules
- **No generic AI purple/violet gradients.** Purple triggers distrust and looks like a synthetic AI template.
- **No pure pitch black (`#000000`).** Use Deep Sacred Teal (`#052f2c`) or Deep Forest Slate (`#1c2b2a`).
- **No neon accents.** All colors must feel grounded in real earth pigments and natural light.

## Typography

### Display Typography: Editorial Serif
- **Family:** `Georgia, Cambria, "Times New Roman", serif`
- **Role:** High-impact editorial headings, emotional donor calls, cultural quotes, and major section titles.
- **Style:** Bold, dignified, with generous line heights (`1.15` to `1.25`) that convey timeless authority.

### Body & Data Typography: Clean Geometric System
- **Family:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- **Role:** Running text, monetary amounts, form fields, government license details, and transaction receipts.
- **Style:** High legibility at small sizes (12px to 16px) with intentional tracking for numerals (`font-variant-numeric: tabular-nums`).

## Layout

### Mobile-First Spacing
- Primary touch targets must measure at least **48x48px** with comfortable padding.
- Horizontal swipeable chips (`.swipe`) for donation presets and quick meal options so mobile users never feel overwhelmed by long vertical walls of cards.
- Bottom safe area adherence: mobile views maintain dedicated padding `calc(5rem + env(safe-area-inset-bottom))` to prevent fixed bottom bars from obscuring buttons.

### Desktop Layout Harmony
- Desktop views expand comfortably to `max-w-6xl` or `max-w-7xl` with 2-to-3 column grid structures.
- Floating checkout drawers and sticky trust bars stay docked neatly without colliding with header navigation or hero typography.

## Elevation & Depth

- **Tonal Layering Over Harsh Drop Shadows:** Rather than heavy dark drop-shadows, depth is achieved through delicate surface tinting (`bg-cream` onto `bg-sand`) paired with subtle 1px border rings (`ring-1 ring-teal-900/10`).
- **Tactile Card Depth:** Cards feature a warm, ambient glow (`box-shadow: 0 2px 8px rgba(5, 47, 44, 0.05)`), deepening smoothly on hover (`0 6px 18px rgba(5, 47, 44, 0.08)`).
- **Subtle Tap Scaling:** Interactive cards and donation chips use `.tap-scale` (`transform: scale(0.97)` on active) to provide tactile physical feedback on touchscreens.

## Shapes

- **Radius Hierarchy:**
  - Micro tags / pills: `rounded-full` or `rounded-lg` (8px).
  - Donation cards and impact selectors: `rounded-2xl` (16px) to `rounded-3xl` (24px).
  - Primary CTA buttons: `rounded-2xl` (16px) with prominent pill-like comfort.
- **No sharp clinical corners.** Rounded geometry reinforces warmth, safety, and childhood approachability.

## Components

### 1. Donation Amount Selector
- Active presets highlight in deep saffron with high-contrast white text.
- Custom amount input supports seamless numeric typing, never forcing preset amounts onto the donor.
- Instantly reflects the real-world impact (e.g. ₹500 = "Feeds 1 child for 1 week", ₹1500 = "Breakfast for all 25 boys").

### 2. Verified Trust Badges
- JJ Act Registration (`KA18CH0242`), Form 10AC Section 80G, and Bangalore police verification badges are always paired with clear icon seals and clickable certificate previews.

### 3. Quick Payment Triggers
- Direct integration with Razorpay supporting one-tap UPI, Google Pay, PhonePe, and instant PDF receipts.

## Do's and Don'ts

### Do:
- **Do** emphasize 25 resident boys and real ashrama photos from Turahalli, Bengaluru.
- **Do** keep donation checkout completely frictionless: 1 tap to select, 1 tap to pay.
- **Do** highlight 80G tax exemption prominently on all transaction screens.
- **Do** preserve donor state across all navigation transitions.

### Don't:
- **Don't** use generic stock photography of crying or distressed children.
- **Don't** use AI purple gradients or neon cybersecurity-style cyber aesthetics.
- **Don't** hide or obscure donation amounts or surprise donors at checkout.
- **Don't** trap users in lengthy multi-page forms before initiating payment.
