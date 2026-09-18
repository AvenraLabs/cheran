---
name: Editorial Industrialism
colors:
  surface: '#fbf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fbf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ed'
  surface-container: '#f0eee7'
  surface-container-high: '#eae8e1'
  surface-container-highest: '#e4e2dc'
  on-surface: '#1b1c18'
  on-surface-variant: '#414942'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1ea'
  outline: '#717972'
  outline-variant: '#c1c9c0'
  surface-tint: '#3a684d'
  primary: '#002c18'
  on-primary: '#ffffff'
  primary-container: '#14432b'
  on-primary-container: '#80b091'
  inverse-primary: '#a1d2b1'
  secondary: '#1f6b3f'
  on-secondary: '#ffffff'
  secondary-container: '#a7f4bb'
  on-secondary-container: '#277245'
  tertiary: '#3e1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e2e00'
  on-tertiary-container: '#e49151'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bceecc'
  primary-fixed-dim: '#a1d2b1'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#224f36'
  secondary-fixed: '#a7f4bb'
  secondary-fixed-dim: '#8cd7a1'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#00522b'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#fbf9f2'
  on-background: '#1b1c18'
  surface-variant: '#e4e2dc'
  ink: '#0F1A12'
  forest-900: '#14432B'
  forest-700: '#1F6B3F'
  forest-500: '#2E8B57'
  sun-500: '#E8B923'
  clay-400: '#C97B3D'
  paper-50: '#FAF8F1'
  paper-100: '#F2EEE2'
  line-200: '#E3DFD2'
  steel-600: '#4A5A52'
typography:
  headline-xl:
    fontFamily: Fraunces
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Fraunces
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0em
  stat-display:
    fontFamily: Fraunces
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 19px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  section-gap-desktop: 7.5rem
  section-gap-mobile: 4rem
---

## Brand & Style

This design system expresses heavy industrial heritage, agricultural engineering precision, and calm editorial authority. Developed for an established enterprise with four decades of manufacturing pedigree, it prioritizes credibility, rigorous compliance (ISI certification standards), and ground-level agricultural efficacy over ephemeral digital software conventions.

The visual style merges tactile editorial publication layout with utilitarian workshop precision. We avoid frivolous SaaS tropes—such as floating multi-layered cards, heavy drop shadows, neon gradients, or generic software badges. Instead, the interface relies on broad horizontal material bands, architectural hairline dividers, high-contrast serif typography, and deliberate photographic calibration evoking South Indian fertile soil, industrial machining, and pressurized water systems. The resulting aesthetic commands the weight, permanence, and dignity of physical equipment.

## Colors

The palette grounds the interface in agricultural earth and precision engineering materials.

- **Primary (`forest-900` / `#14432B`)**: Dense, deep evergreen serving as the primary structural anchor. Used for primary headers, high-contrast dark bands, institutional credibility sections, and authoritative footer zones.
- **Secondary (`forest-700` / `#1F6B3F`)**: Mechanical brand green used for primary interactive triggers, active navigation states, selected tabs, and interactive hover borders.
- **Tertiary (`clay-400` / `#C97B3D`)**: Warm, unglazed terra-cotta tone derived from fertile agricultural red soil. Strictly designated for soil science, drip line installation details, and agronomy-focused callouts.
- **Neutral Canvas (`paper-50` / `#FAF8F1` & `paper-100` / `#F2EEE2`)**: Warm, fibrous archival paper tones replacing sterile digital white to reduce field glare and provide editorial warmth.

### Color Governance Rules
1. **Single-Accent Rule**: Restrict accent colors strictly by contextual intent. Use `sun-500` exclusively for state subsidies, ISI certifications, and benchmark percentages. Use `clay-400` exclusively for soil, crop, and field-line parameters. Never deploy `sun-500` and `clay-400` simultaneously within the same section viewport.
2. **Text Hierarchy**: Body copy sits on `ink` (`#0F1A12`), a saturated deep black with an organic green cast, eliminating stark synthetic black contrast. Muted documentation and table metadata utilize `steel-600` (`#4A5A52`).
3. **Dividers**: All spatial separation is governed by `line-200` (`#E3DFD2`), maintaining an authentic architectural drafting blueprint appearance.

## Typography

The typographic system creates an intentional tension between classical editorial craftsmanship and pragmatic engineering utility.

- **Display & Headlines (`Fraunces`)**: An authoritative, high-contrast serif. It provides historic dignity, institutional weight, and agricultural gravitas. Headlines use tight letter-spacing and substantial weights (600 to 800) to stand out against tactile paper backgrounds.
- **Body & Specification Tables (`Inter`)**: A functional grotesque providing high legibility across dense engineering data, diameter/micron gauges, and field operation guidelines.
- **Regional Localization (`Noto Sans Tamil`)**: For Tamil language toggles, match baseline heights and x-height metrics directly to Inter, preserving identical rhythm and ensuring zero layout-shift across dynamic language switching.
- **Directional & Stat Numerals**: Figures denoting years of heritage, ISI certification numbers, and flow rates use `stat-display` to present quantifiable metrics with immovable clarity.

## Layout & Spacing

Layouts follow an asymmetric 12-column architectural grid capped at a maximum width of `1280px`. Avoid centered single-column SaaS stacks; layout compositions favor structural asymmetry—pairing a 5-column technical narrative with a 7-column field or factory image, alternating direction down the canvas.

### Rhythm & Breakpoints
- **Desktop (1024px – 1440px)**: 12 columns with `1.5rem` (24px) gutters and `2.5rem` (40px) outer margins. Major section boundaries breathe via `7.5rem` (120px) vertical margins to honor an editorial reading pace.
- **Tablet (768px – 1023px)**: 8 columns with `1.25rem` (20px) gutters. Asymmetrical splits fold into consolidated content blocks.
- **Mobile (375px – 767px)**: 4 columns with `1rem` (16px) gutters and `1.25rem` (20px) margins. Section rhythm condenses to `4rem` (64px). 4-column trust metrics reflow into balanced 2×2 blocks.
- **Alternating Material Strips**: Rather than relying on floating container cards, pages transition through full-width background surface zones (`paper-50` to `paper-100` to `forest-900`) bounded by explicit 1px `line-200` hairpins.

## Elevation & Depth

This design system deliberately eschews simulated atmospheric light sources, multi-layer drop shadows, and synthetic blur filters. Depth is physical, architectural, and tactile.

- **Flat Material Layering**: Surfaces achieve hierarchy solely through the calibrated physical juxtaposition of alternating planes (`paper-50`, `paper-100`, and `forest-900`). 
- **Hairline Boundaries**: Structural demarcation relies entirely on 1px solid outlines in `line-200` (`#E3DFD2`). On dark `forest-900` containers, borders shift to `rgba(227, 223, 210, 0.15)`.
- **Subtle Grounding Shadow**: If an isolated card or dialog requires spatial grounding against a matching background, use an imperceptible stamp shadow: `0 1px 2px rgba(15, 26, 18, 0.04)`.
- **Prohibited Effects**: Glassmorphism, blurred backdrop filters (`backdrop-filter: blur`), floating neumorphic extrusions, and elevation jumps on hover are strictly prohibited. Hover states are communicated via 1px border color swaps (to `forest-700`) or subtle image zoom (scale 1.04), never through drop-shadow expansion.

## Shapes

The shape system expresses engineered industrial sheet metal, extruded PVC, and technical drafting paper.

- **Default Geometry (Level 1 - Soft)**: Structural containers, interactive buttons, inputs, and specification cards use a restrained `0.25rem` (4px) corner radius. This prevents severe brutalist edge bite while maintaining the tight discipline of manufacturing drawings.
- **Editorial Category Masks**: On desktop, featured hero components and product category displays utilize a hard 0px edge or geometric industrial hexagonal crops reminiscent of brass fittings and pipeline couplings. On viewport sizes below 768px, these adapt to standard 4px rounded rectangles.
- **Pinned Communication Capsule**: The sole exception to the shape rule is the floating/pinned contact telephone CTA, which adopts a full pill geometry (`border-radius: 9999px`) to immediately identify it as an urgent, universal operational tool.

## Components

### Buttons & Interactive Controls
- **Primary Industrial CTA**: Background `forest-700` (`#1F6B3F`), text `paper-50`, `4px` border radius, padding `0.875rem 1.75rem`. Letter-spacing `0.02em` in `label-lg`. On `:hover`, background deepens to `forest-900` accompanied by a smooth `150ms` transition.
- **Secondary / Spec Sheet Button**: Transparent background, 1px solid `line-200` (`#E3DFD2`), text `forest-900`. On `:hover`, border shifts to `forest-700` and background tints to `paper-100`.
- **Editorial Text Links**: Inline links use `forest-700` with a persistent 1px underline positioned at `4px` baseline offset; never use raw generic blue.

### Telephone Utility Action (Sticky Call Capsule)
- Pinned header or persistent bottom corner capsule in `forest-900` with gold `sun-500` icon accent. Border radius `9999px`, padding `0.625rem 1.25rem`. Features a quiet 2-second looped opacity pulse (`0.9` to `1.0`) on the dialer icon.

### Technical Product & Category Cards
- Constructed with a solid 1px `line-200` border, `paper-50` background, and zero baseline shadow. Internal padding scales between `2rem` (32px) and `2.5rem` (40px). 
- Card imagery uses a fixed 4:3 or 16:9 crop with an authentic technical grade. On hover, the image scales subtly (`1.0` to `1.04` over `400ms`) and the 1px card perimeter cleanly transitions from `line-200` to `forest-700`.

### Data Tables & Specification Grids
- Designed to replicate technical engineering catalogs. Header rows are grounded in `paper-100` with uppercase `label-sm` text in `steel-600`.
- Cell dividers use 1px horizontal `line-200` borders. Alternating rows remain unshaded or use subtle `rgba(242, 238, 226, 0.4)`. Key measurements (pipe diameter, pressure bars, wall thickness) are set in monospace-tuned weights of `Inter`.

### Certification & Subsidy Badges
- **ISI / Compliance Seals**: Rendered in monochrome `steel-600` on load; crossfading to official state coloration or `sun-500` highlights upon user hover.
- **Subsidy Callout Blocks**: Enclosed within full-width `forest-900` bands or dedicated `paper-100` cards bounded by a left 4px accent border in `sun-500` (`#E8B923`). The subsidy percentage uses `stat-display` sizing to ensure instant farmer comprehension.

### Form Inputs & Quotation Inquiries
- Base canvas `paper-50` with 1px `line-200` borders and 4px radius. 
- Focus state shifts border directly to `forest-700` with zero diffuse glow or ring offset. Field labels sit above in `label-md` using `forest-900`.