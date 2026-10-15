# Design

Source of truth: `design/gen-z-landing/*.dc.html` (7 pages, pre-approved handoff). This doc extracts the token system so implementation stays consistent across files without re-reading the mockups each time.

## Concept

Neobrutalist "sticker" system: thick black borders + hard offset drop-shadows (no blur) on nearly everything, over a warm cream canvas, drenched in saturated brand color. Not restrained-minimal — the loudness IS the brand.

## Color

All hex, translate to OKLCH when wiring into CSS variables (keep the same visual hue/chroma/lightness relationships).

**Ink & surfaces**
- `--ink` `#14121C` — primary text, all signature borders, dark surfaces (sidebar, footer, inverted cards)
- `--cream` `#FFF6EC` — marketing page base background
- `--cream-app` `#F4EDE3` — dashboard/app base background (one notch deeper than marketing, so cards on top read as elevated)
- `--surface` `#EFE9E0` — card/panel tint on cream backgrounds
- `--border-muted` `#E4DFD6` / `#D9D2C6` / `#C9C3D6` — soft dividers inside cream cards (vs. the signature 2px ink border for card edges)

**Brand + accents** (full palette strategy — every accent gets real use, not one timid highlight)
- `--purple` `#6C3BFF` (hover/dark `#4A22C4`) — primary brand, primary CTAs, links, focus ring
- `--lime` `#C8FF4D` (ink-on-lime text `#3F5209`) — high-energy accent: badges, "live" indicators, hover shadow swaps
- `--pink` `#FF3D8B` (dark `#B3005C`, light tint `#FFE9F2`) — secondary energy accent, alerts/notification dot
- `--cyan` `#38D6FF` — tertiary accent, info/secondary CTA shadows
- `--amber` `#FFB93D` (dark `#A96500`) — warm accent, badges/highlighters
- `--success` `#1F6B33` on `#DFFFD6` — success states

**Text**
- Body secondary: `#443F55`
- Muted: `#5A5468`, `#8B839F` (sidebar inactive items), `#88829B`

## Typography

- **Display** — `Bricolage Grotesque`, weight 700–800. Headlines, nav logo, big numbers. Tight tracking: `-0.02em` to `-0.035em`. Hero H1 ~72px/0.94 line-height; section H2 ~52px/1.
- **Body** — `Manrope`, weight 400–800. Default UI/copy font.
- **Mono/label** — `Space Mono`, weight 400/700, uppercase, letter-spacing `0.06em`–`0.14em`. Used for eyebrows, stat labels, badges, timestamps — the "technical annotation" voice against the two humanist faces.

Google Fonts: `Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800`, `Manrope:wght@400;500;600;700;800`, `Space+Mono:wght@400;700`.

## Radius scale

`999px` pill (buttons, badges) · `22/20/18px` large cards · `16/14/13/12/11/10px` standard cards/inputs/buttons · `8/9/6px` small chips/icon boxes · `4px` tiny (underline highlight marks).

## Borders & shadows (the signature move)

- Default border: **`2px solid #14121C`** on almost every card, button, input, badge, avatar.
- Inverted (on dark surfaces): `2px solid #FFF6EC`.
- Muted internal dividers: `1-2px solid` one of the border-muted tones above.
- **Shadow = solid offset, zero blur**: `Npx Npx 0 <color>`, N typically 3–6 at rest (8–10 for hero-level elements). Shadow color is usually `--ink`, but swaps to a brand accent for emphasis (e.g. CTA button shadow in lime/pink/cyan).
- **Hover**: either (a) lift — `translate(-3px,-3px)` + larger shadow, or (b) press — `translate(2px,2px)` + smaller/removed shadow. Pick per element based on whether it reads as "liftable" (cards) or "pressable" (buttons).
- Focus ring (inputs): `border-color: var(--purple)` + `box-shadow: 0 0 0 4px rgba(108,59,255,0.16-0.18)`. Never rely on the offset shadow alone for focus — it's not a focus indicator, add the ring.

## Motion

Custom keyframes, all need `prefers-reduced-motion` fallbacks (crossfade/static):
- `om-marquee` — infinite horizontal scroll (feature ticker). Duplicate content track, `translateX(0 → -50%)`, ~34s linear.
- `om-float` — gentle bob: `translateY(0 → -14px)` + a fixed rotation per element (`--r` custom prop), ease-in-out, 6–7.5s, staggered delays.
- `om-blink` — opacity pulse `1 → .25 → 1` for "live" status dots, 1.6s ease-in-out infinite.
- `om-spin` — standard 360° rotation for loaders.

## Layout

- Max content width `1240px`, side padding `28px`.
- Marketing hero: 2-col grid (`1.05fr 0.95fr`), collapses to 1-col on mobile.
- Feature grids: `repeat(3, 1fr)` desktop → stack on mobile.
- Dashboard: fixed dark sidebar (`258px`, `#14121C`) + fluid main content on `--cream-app`. Sidebar nav items use pill-shaped active-state background; badges (count, "Soon") right-aligned.

## Components (patterns to reuse, not literal copies)

- **Button primary**: ink or purple fill, ink 2px border, offset shadow in a contrasting accent, press-on-hover.
- **Card**: white or surface-tint fill, 2px ink border, `20-22px` radius, offset ink shadow, lift-on-hover with shadow color shifting to a brand accent.
- **Badge/pill**: `999px` radius, 2px ink border, mono uppercase label, tight tracking.
- **Floating annotation card** (marketing only): small stat/quote card absolutely positioned over the hero image, `om-float` animation, rotated a few degrees.
- **Sidebar nav item**: icon + label, pill highlight on active/hover, muted (`#8B839F`) when inactive, trailing badge slot.

## Accessibility notes

- Every color pairing above must be contrast-checked before shipping (white-on-purple, ink-on-lime, ink-on-amber, etc.) — see PRODUCT.md Accessibility section.
- Reduced-motion swaps are mandatory, not optional, given how much of this system leans on `om-*` animations.
