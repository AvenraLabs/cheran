# Cheran Irrigation × Cheran Plast — Website Design & Build Spec

**Purpose of this doc:** paste into Google Stitch for visual design generation, and/or hand to Antigravity as the build spec. It covers brand strategy, sitemap, visual system, animation spec, page-by-page layout, image-generation prompts, copy skeleton, SEO, tech stack/rules, and edge cases.

---

## 0. Brand Strategy (locked decisions)

- **One site, two brand wings** under a shared nav/header. Cheran Plast (est. 1983, PVC/UPVC/HDPE pipe manufacturer) is the parent; Cheran Irrigation (est. 2017) is the drip/sprinkler irrigation-solutions unit. Structure it like a manufacturing group with two product divisions — NOT two disconnected brochures.
- **Language:** English-first. Tamil toggle (top-right, globe or "த" icon) that swaps visible copy — not a separate subdomain. Numerals, phone numbers, addresses stay identical in both.
- **Primary goal:** credibility + trust. This is a brochure/authority site, not a lead-gen funnel. No pop-ups, no chat widgets, no gated PDFs. The single dominant CTA everywhere is **the phone number** (click-to-call on mobile) — treat it like a persistent, calm anchor, not a shouty button.
- **Tone:** industrial heritage + precision engineering. Think "40+ years, ISI-certified, government-recognized" — not "startup SaaS." Avoid anything that reads as generic AI-template (no purple gradients, no floating 3D blobs, no stock "handshake" photos, no emoji icons).

---

## 1. Sitemap

```
/                         Home (group overview, both brands, trust bar)
/cherran-irrigation       Brand page: products, subsidy info, certifications
/cheran-plast             Brand page: PVC/UPVC/HDPE manufacturing, heritage
/products                 Combined filterable catalog (category tabs)
/products/[slug]          Individual product detail (specs table, sizes, ISI marks)
/subsidy-guide            Govt drip-irrigation subsidy explainer (75%/100%) + required documents checklist
/about                    Company history (1983 → 2017 → today), founder, core values (8-leaf tree from PDF), vision/mission
/certifications           IS:4985:2021, IS:13488:2008, IS:13487:2024, IS:12786:2024, ISI mark — with scan/badge images
/contact                  Both factory addresses, maps, phone numbers, email, enquiry form (secondary to phone)
/gallery                  Field installations, factory, product photography
```

Footer repeats on every page: both addresses, both phone numbers, both emails, toll-free number, certification badges row, social links (if any), "Since 1983" line.

---

## 2. Visual Design System

### 2.1 Color Palette
Pull directly from the brand's own materials (the flyers already use a strong green/yellow agricultural palette) but refine it to feel premium, not like a printed pamphlet.

| Token | Hex | Use |
|---|---|---|
| `--ink` | #0F1A12 | Primary text, near-black with a green cast |
| `--forest-900` | #14432B | Header bg, footer bg, dark sections |
| `--forest-700` | #1F6B3F | Primary brand green (buttons, links, underlines) |
| `--forest-500` | #2E8B57 | Secondary accents, icons |
| `--sun-500` | #E8B923 | Accent gold (subsidy badges, highlights) — used sparingly, ~5% of UI |
| `--clay-400` | #C97B3D | Earth-tone accent for irrigation/soil imagery overlays |
| `--paper-50` | #FAF8F1 | Main background (warm off-white, not sterile #FFF) |
| `--paper-100` | #F2EEE2 | Section alternation background |
| `--line-200` | #E3DFD2 | Hairline borders/dividers |
| `--steel-600` | #4A5A52 | Muted body text |

Rule: **no more than one accent color visible per screen at a time.** Gold for subsidy/certification content, clay for irrigation/soil content, green for structural/brand elements. Never mix all three in one hero.

### 2.2 Typography
- **Display/Headings:** A high-contrast serif or slab-serif with engineering/industrial character — e.g. "Fraunces" (Google Fonts) at heavy weight for H1/H2, tightened letter-spacing (-0.01em). This is what makes it feel premium instead of generic sans-everywhere.
- **Body/UI:** "Inter" or "General Sans" — clean grotesque, weight 400/500.
- **Tamil toggle font:** "Noto Sans Tamil" or "Catamaran" — must pair visually with Fraunces/Inter (similar x-height proportions).
- Scale: H1 56–72px desktop / 32–40px mobile, H2 40px/28px, body 17px/16px, generous line-height (1.6 body, 1.15 headings).
- Numerals in stat blocks (e.g. "40+ Years", "75% Subsidy") get the serif display font at large scale — this is a classic premium-industrial move.

### 2.3 Spacing & Grid
- 12-column grid, max content width 1280px, generous section padding: 120px desktop vertical rhythm between major sections, 64px mobile.
- Asymmetric layouts over centered-everything: e.g. text block left 5 cols / image right 7 cols, alternating sides per section down the homepage. This alone kills the "generic AI template" look (centered-stack-of-cards syndrome).
- Cards: avoid heavy drop shadows. Use 1px hairline border (`--line-200`) + very subtle shadow (`0 1px 2px rgba(15,26,18,0.04)`) + generous internal padding (32–40px).

### 2.4 Imagery Treatment
- All photography gets a consistent duotone/color-grade overlay pass toward the forest-green palette (subtle, not full duotone) so stock-feeling images unify into one brand world.
- Use diagonal/hexagon crop masks sparingly (the source flyer already uses hexagons for the product grid — echo that ONE motif in one section only, e.g. the "Our Products" grid, not everywhere).
- Full-bleed hero image: irrigated field at golden hour (matches the PDF cover) with a dark gradient overlay bottom-to-top (`--forest-900` at 60% → transparent) so white/gold headline text sits legibly over it.

---

## 3. Animation & Interaction Spec

**Philosophy:** restrained, physical, purposeful. Nothing should animate just to prove it can. Every motion should feel like it has weight (industrial materials — pipe, water, soil), not like a SaaS dashboard.

| Element | Behavior |
|---|---|
| Page load | Hero headline + subhead fade-up 24px, staggered 80ms per line, ease `cubic-bezier(0.22,1,0.36,1)`, 600ms |
| Scroll reveal | Sections fade-up 16px + opacity 0→1 on entry, IntersectionObserver, trigger at 15% viewport, NOT re-triggering on scroll-up (feels cheap) |
| Stat counters | Numbers count up from 0 once, on first viewport entry only (e.g. "40+ Years", "1000+ Farmers Served") — 1.2s ease-out |
| Water/drip motif | One signature moment: on the homepage hero or a dedicated section, a thin SVG line animates like water flowing through a drip line (stroke-dashoffset animation), timed slow (3–4s loop, low opacity) — this is your "premium signature detail," use it exactly once, not on every page |
| Product cards | On hover: image scale 1.0→1.04 (400ms), subtle border color shift to forest-700, no shadow pop — keep it dry/quiet |
| Nav | Sticky header, background transitions from transparent (over hero) to `--paper-50` + hairline border after 80px scroll, 200ms |
| Brand toggle (Irrigation/Plast) | If using a split entry on homepage: two large panels, on hover the non-hovered panel dims to 70% opacity + desaturates slightly — cinematic, not bouncy |
| Certification badges | Static, no animation — these should read as serious/official, never playful |
| Tamil toggle | Instant crossfade of text nodes (150ms), no layout shift — pre-set line-height/width to avoid reflow jank |
| Mobile | Reduce all animation distances by half, cap durations at 400ms, respect `prefers-reduced-motion: reduce` globally (disable all non-essential motion) |

**Explicitly avoid:** parallax scrolling of background images (dated), particle/confetti effects, cursor-follow blobs, typewriter text effects, 3D tilt-on-hover cards, autoplay video backgrounds, gradient-shifting buttons, glassmorphism panels. These are the top signals of "generic AI-generated site."

---

## 4. Page-by-Page Layout

### Home
1. **Header** — logo left (small "C" monogram + wordmark), nav center/right (Products, About, Certifications, Contact), phone number pinned top-right in a pill with a small pulsing (very subtle, 2s, opacity 0.9→1) call icon, Tamil toggle far right.
2. **Hero** — full-bleed field photo, overlay gradient, H1 ("Smart Irrigation & Precision Piping, Since 1983" or similar — write final copy after brand review), subhead one line, two ghost-outline buttons: "Explore Irrigation Solutions" / "Explore Piping Solutions" leading to the two brand pages.
3. **Trust bar** — thin strip directly under hero: 4 stat blocks (Years since 1983, Certifications count, Products range, Districts served) with count-up numbers, separated by hairline verticals.
4. **Two-brand split section** — large asymmetric two-panel block introducing Cheran Irrigation and Cheran Plast side by side with one signature photo each, one-line description, "Learn more →" text link (not a boxed button — keep it editorial).
5. **Product category grid** — hexagon-masked images (echo PDF), 4–6 categories (HDPE Hose, PVC Pipes, LLDPE Hose, MDPE Hose, Sprinkler Fittings, Filtration Systems).
6. **Subsidy callout band** — full-width dark forest-900 section with gold accent numerals: "Up to 100% Government Subsidy for Small Farmers" + "75% for General Category" + a text link to `/subsidy-guide`. Restrained, no giant badge graphics.
7. **Certifications strip** — logos/badges of IS:4985:2021 etc. in a quiet grayscale row that colors on hover.
8. **Founder/heritage teaser** — quote or short passage about Mr. P.R. Kuppusamy and the 1983→2017 timeline, leading to `/about`.
9. **Footer** — full contact grid (see sitemap footer note above).

### Brand pages (Cheran Irrigation / Cheran Plast)
- Hero specific to that brand (irrigation = green field imagery; plast = pipe manufacturing imagery, matches the water-droplet PVC pipe visual from the flyer).
- Product listing filtered to that brand.
- For Cheran Irrigation specifically: dedicated subsidy-documents checklist block (Chitta & RSR, Adangal, VAO certificate, land survey map, joint survey map, small farmer certificate, land ownership copy, ration card copy, Aadhaar copy, water-soil test certificate, bank passbook copy, passport photo — pull exactly from the flyer's list, translated to English with Tamil toggle available).

### Product detail page
- Left: image gallery (product + in-field usage photo). Right: spec table (size range, pressure rating, material grade, IS standard), "Enquire about this product" → opens phone number, not a form-first flow.

### Contact
- Two clearly separated address blocks (Cheran Irrigation vs Cheran Plast — note they're different S.F. numbers on the same Uthukuli Road), embedded map per location, click-to-call buttons, email links, toll-free number in large type.

---

## 5. Image Generation — Prompts

Use these with your preferred image model (Midjourney/Ideogram/Flux) to build a consistent photography-style asset library. Keep every prompt anchored to the same style suffix for consistency.

**Style suffix to append to every prompt:**
`, professional agricultural/industrial photography, warm golden-hour or soft overcast lighting, shallow depth of field, muted earthy green and clay tones, no text, no logos, high detail, realistic, 4:3 or 16:9`

1. **Hero — irrigated field:** "Wide aerial-eye-level shot of a lush green row-crop field with black drip irrigation lines visible on the soil between plants, South Indian farmland, morning mist in the background hills" + style suffix
2. **Cheran Plast manufacturing:** "Interior of a modern pipe extrusion factory, stacked grey PVC pipes in neat rows, industrial machinery, clean concrete floor, natural light through high windows" + style suffix
3. **Water droplet / PVC pipe (matches flyer motif):** "Macro shot of a clean water droplet falling from the open end of a white PVC pipe against a soft blue gradient background, crisp reflection" + style suffix
4. **Drip line close-up:** "Extreme close-up of a black drip irrigation emitter releasing a single water droplet onto dark soil next to a young plant seedling" + style suffix
5. **HDPE hose coil:** "Neatly coiled black HDPE hose pipe with green stripe, stacked in a warehouse, soft studio-style side lighting" + style suffix
6. **Filtration system:** "Green sand-filtration tanks and grey PVC piping installed outdoors at a farm irrigation pump station, clear sky" + style suffix
7. **Founder/heritage portrait placeholder:** *(do not AI-generate a real person's likeness — use an actual photo if available, or a generic silhouette/workshop-1983-era stock photo instead)*
8. **Sprinkler in field:** "Close-up of a black sprinkler irrigation head spraying fine mist over a banana plantation row, backlit by sun" + style suffix
9. **Certification badge background:** "Flat lay of rolled technical blueprints and a certification seal on a wooden desk, soft top light, minimal" + style suffix
10. **Gallery — pipe stacks:** "Rows of grey PVC pipes of varying diameters stacked diagonally, industrial yard, high contrast daylight" + style suffix

Generate each at 2–3 variations, pick the one with the most consistent color grade, then apply the same green-leaning color grade pass (Section 2.4) in post before uploading.

---

## 6. Copy Skeleton (fill in with verified facts only — do not invent stats)

- Founded: 1983 by Mr. P.R. Kuppusamy (Cheran Plast); Cheran Irrigation unit added 2017.
- Certifications: IS:4985:2021, IS:13488:2008, IS:13487:2024, IS:12786:2024, ISI marked.
- Products: HDPE Hose, PVC Pipes, LLDPE Hose, MDPE Hose (irrigation); PVC/UPVC/HDPE water-line pipes (Plast).
- Core values (8, from the flyer's tree graphic): Honesty, Trust, Efficiency, Loyalty, Innovation, Reliability, Qualities, Services.
- Vision: to become a global player in the drip irrigation industry, helping farmers achieve mission-critical success.
- Mission: manufacture the best products, prioritize quality, deliver good value for money.
- Subsidy: 100% for small farmers, 75% for general category (verify current scheme name/authority before publishing — subsidy % and eligibility change by government order, do not treat the flyer numbers as permanently accurate).
- Contact — Cheran Irrigation: S.F.No.145, Uthukuli Road, Vijayamangalam, Perundurai Taluk, Erode District, Tamil Nadu 638056. Email: cherrandrip@gmail.com. Business enquiry: +91 98428 11595. Toll-free: 1800 425 1595.
- Contact — Cheran Plast: S.F.No.137, Uthukuli Road, Vijayamangalam, Perundurai, Erode – 638056. Email: cheraanplast@yahoo.com. Cell: 9443342087, 9842811595.

**Do NOT invent:** number of employees, revenue, "1000+ farmers served" style stats, awards, or client logos unless the client supplies them. Leave placeholders marked `[VERIFY]` in the build rather than fabricating numbers — a false claim on a govt-subsidy-adjacent agricultural site is a credibility and possibly legal risk.

---

## 7. Technical Stack & Build Rules (for Antigravity)

- **Framework:** Next.js (App Router) + Tailwind CSS. Static generation (SSG) for all pages — this is a brochure site, no need for SSR/DB unless a CMS is added later.
- **Recommended packages:**
  - `framer-motion` — for the restrained scroll-reveal/stagger animations in Section 3 (respect `prefers-reduced-motion`)
  - `next/image` — mandatory for all imagery, with explicit width/height to prevent layout shift
  - `next-intl` or a lightweight custom context — for the English/Tamil toggle (avoid full i18n routing complexity; simple client-side dictionary swap is enough for a 2-language brochure site)
  - `@vercel/og` or manual static OG images — for social share previews per page
  - Fonts via `next/font` (self-hosted Fraunces/Inter/Noto Sans Tamil — do NOT load from Google Fonts CDN directly, for performance + no CLS)
- **Forms:** if you add the enquiry form on `/contact`, use a simple serverless handler (Formspree, Resend, or a Next.js API route + email) — keep it optional/secondary, phone is primary CTA per Section 0.
- **CMS (optional, recommend for future):** if the client will update products/prices themselves, wire product data from a simple JSON/MDX content folder now so it's trivial to swap to a headless CMS (Sanity/Contentful) later without a rebuild.

### Performance rules
- Lighthouse targets: Performance ≥90, Accessibility ≥95, SEO ≥95 (mobile).
- All hero/above-fold images: `priority` loading, served as AVIF/WebP with JPEG fallback, responsive `srcset`.
- Total JS on first load target: <150KB gzipped excluding framework runtime.
- No layout shift from the Tamil toggle — pre-measure both language strings or use fixed min-heights on text containers.

### Accessibility rules
- Color contrast: body text on `--paper-50` and `--forest-900` sections must pass WCAG AA (4.5:1) — test `--sun-500` gold text carefully, it's the most likely to fail on light backgrounds; use it only on dark `--forest-900` sections or as a border/icon color, never as body text on `--paper-50`.
- All click-to-call links: real `tel:` hrefs, not JS-only.
- All images: descriptive alt text (not "image1.jpg"); decorative images get `alt=""`.
- Keyboard nav: visible focus rings on all interactive elements (don't remove browser default without replacing it).
- Language toggle must update `<html lang="">` attribute for screen readers.

### Responsive rules
- Breakpoints: 375 / 768 / 1024 / 1440.
- Mobile nav: full-screen slide-in menu (not a tiny dropdown), phone number stays visible/sticky in the mobile header at all times (it's the CTA).
- Hexagon/diagonal image crops from Section 2.4 degrade to simple rounded-rect crops below 768px — hexagon masks look cramped and break on small screens.
- Stat counter row (Section 4, Home #3) stacks 2×2 on mobile, not 1×4.
- Tables (product specs) become horizontally scrollable cards or stacked key-value pairs below 768px, never shrink-to-fit tiny text.

### Edge cases to explicitly handle
- Very long product names / Tamil translations that are longer than English — test layout with the longest string, not just placeholder "Product Name."
- No-JS fallback: core content (address, phone, product list) must be present in initial HTML, not dependent on client-side rendering — this matters for SEO and for rural users on poor connections/older browsers.
- Slow 3G / rural connectivity: this is an agricultural audience often browsing on budget Android phones with patchy signal. Keep total page weight low, avoid heavy video, test on Fast 3G throttling in devtools, not just cable wifi.
- Two different physical addresses (S.F.No.145 vs S.F.No.137) on the same road — make sure the map/contact UI never merges them into one pin.
- Subsidy percentages and required-document lists change with government policy — build this as easily-editable content (CMS/MDX), not hardcoded in a component, and add a small "verify current scheme details with your local agriculture office" disclaimer near the subsidy content.
- Toll-free number (1800 425 1595) won't work from outside India or from some mobile carriers on VoIP apps — list the direct cell numbers alongside it, not instead of it.
- Print stylesheet: someone may print the product spec page — add a minimal `@media print` that strips nav/footer/backgrounds and keeps the spec table readable in black-and-white.

---

## 8. SEO

- **Meta titles:** brand + product/category + location, e.g. `Drip Irrigation Hose Pipes Manufacturer | Cheran Irrigation, Erode Tamil Nadu`. Keep under 60 chars.
- **Meta descriptions:** include certification + location keywords naturally, under 155 chars.
- **Structured data (JSON-LD):**
  - `Organization` / `LocalBusiness` (two entries — one per brand, or `Organization` with `subOrganization` if you want to model the group relationship) with `address`, `telephone`, `sameAs`.
  - `Product` schema on each product detail page (name, description, material, image).
  - `BreadcrumbList` on all deep pages.
- **Local SEO:** register both entities on Google Business Profile with correct S.F. number addresses; NAP (Name/Address/Phone) consistency across site footer, GBP, and any directory listings is critical for a manufacturer targeting a specific taluk/district.
- **Keywords to target naturally in copy** (do not stuff): "drip irrigation Erode", "HDPE pipe manufacturer Tamil Nadu", "PVC pipe Vijayamangalam", "irrigation subsidy Tamil Nadu", "ISI certified drip hose", "agriculture subsidy drip irrigation Erode district".
- **Sitemap.xml + robots.txt:** auto-generate via Next.js (`next-sitemap` package); submit to Google Search Console.
- **hreflang:** if Tamil is a true separate route (`/ta/...`) rather than a client toggle, add `hreflang="ta-IN"` / `hreflang="en-IN"` tags. If it's a client-side toggle only (as recommended in Section 7), skip hreflang and instead ensure the default English HTML is what search engines index.
- **Image SEO:** descriptive filenames (`hdpe-hose-coil-cheran-irrigation.jpg`, not `IMG_4021.jpg`), alt text with natural keyword inclusion, compressed but not degraded.
- **Core Web Vitals:** this doubles as the Section 7 performance rules — LCP <2.5s, CLS <0.1, INP <200ms are direct ranking factors, especially important given the likely rural/mobile audience with slower connections.

---

## 9. What "premium, not generic-AI" looks like — checklist before shipping

- [ ] No centered-hero-with-two-buttons-and-floating-gradient-blob layout
- [ ] Asymmetric grid used in at least 3 sections
- [ ] One signature animation motif (water/drip line), used exactly once, not everywhere
- [ ] Serif/slab display type paired with a grotesque body — not one generic sans-serif for everything
- [ ] Color palette pulled from the brand's own materials, refined — not a default Tailwind indigo/violet SaaS palette
- [ ] Real product photography (or well-graded AI images matching Section 5), not generic stock "farmer shaking hands" photos
- [ ] Certification badges treated as serious documentation, not decorative icons
- [ ] Every number/stat on the site is verified or clearly marked `[VERIFY]` — nothing fabricated
- [ ] Mobile experience tested on throttled connection, not just resized desktop browser
- [ ] Tamil toggle tested with actual Tamil string lengths, not lorem ipsum

---

*Next steps: (1) confirm/verify the copy-skeleton facts in Section 6 with the client before publishing, especially subsidy percentages and any stats; (2) generate the image set in Section 5 and color-grade consistently; (3) paste this doc into Google Stitch for the visual mockup pass, then hand the resulting screens + this spec to Antigravity for the Next.js build.*
