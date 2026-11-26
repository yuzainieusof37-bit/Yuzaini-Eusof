---
name: Apex Markets Mobile
colors:
  surface: '#1e222d'
  surface-dim: '#0f131e'
  surface-bright: '#353945'
  surface-container-lowest: '#0a0e19'
  surface-container-low: '#171b26'
  surface-container: '#1b1f2b'
  surface-container-high: '#262a35'
  surface-container-highest: '#313441'
  on-surface: '#dfe2f2'
  on-surface-variant: '#c3c5d8'
  inverse-surface: '#dfe2f2'
  inverse-on-surface: '#2c303c'
  outline: '#8d90a2'
  outline-variant: '#434656'
  surface-tint: '#b6c4ff'
  primary: '#b6c4ff'
  on-primary: '#002780'
  primary-container: '#2962ff'
  on-primary-container: '#f7f5ff'
  inverse-primary: '#004ee8'
  secondary: '#c4c6d2'
  on-secondary: '#2d303a'
  secondary-container: '#464953'
  on-secondary-container: '#b5b8c4'
  tertiary: '#ffb59a'
  on-tertiary: '#5b1b00'
  tertiary-container: '#c74500'
  on-tertiary-container: '#fff4f1'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#001550'
  on-primary-fixed-variant: '#003ab3'
  secondary-fixed: '#e0e2ee'
  secondary-fixed-dim: '#c4c6d2'
  on-secondary-fixed: '#181b24'
  on-secondary-fixed-variant: '#434750'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#0f131e'
  on-background: '#dfe2f2'
  surface-variant: '#313441'
  surface-raised: '#242835'
  border-subtle: '#2a2e39'
  border-bold: '#363a45'
  text-primary: '#d1d4dc'
  text-secondary: '#787b86'
  text-white: '#ffffff'
  market-up: '#089981'
  market-up-subtle: rgba(8, 153, 129, 0.12)
  market-down: '#f23645'
  market-down-subtle: rgba(242, 54, 69, 0.12)
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  ticker-symbol:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-compact:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.04em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-sm: 0.5rem
  margin: 1rem
  margin-mobile: 0.75rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system embodies the high-velocity, analytical precision of professional trading platforms, optimized specifically for modern handheld interfaces. The aesthetic prioritizes absolute legibility, information density, and instant cognitive capture of volatile market telemetry. It delivers an authoritative, institutional-grade atmosphere tailored for quantitative analysts, retail traders, and global market enthusiasts.

Visual execution is strictly functional and dark-first. It pairs crisp, low-contrast border geometry with sharp chromatic feedback mechanisms for price action. Extraneous decoration and heavy visual weight are eliminated in favor of clean numerical data alignment, clear typographic hierarchy, and tactical color accents that denote directional momentum without inducing eye fatigue during prolonged analytical sessions.

## Colors

The palette utilizes a tailored dark theme that reduces OLED power draw and eliminates glare. The canvas background (`#131722`) establishes deep contrast, while secondary surfaces (`#1e222d` and `#242835`) provide tiered component containment. Structural grid divisions rely on `#2a2e39` to demarcate high-density data rows without visual clutter.

Directional signals use calibrated financial primaries: `#089981` indicates bullish/positive price action, while `#f23645` signals bearish/negative action. These chromatic indicators are paired with matching 12% alpha-tinted fills for badge containers and sparkline fills. Primary interactive elements, selected state pills, and chart actions leverage vibrant accent blue (`#2962ff`). Text hierarchy is strictly maintained through `#d1d4dc` for primary ticker symbols, prices, and metrics, falling back to `#787b86` for secondary metadata, exchange tags, and axis labels.

## Typography

Typography balances rapid scanning with dense numeric clarity. Headlines utilize **Space Grotesk** to provide geometric punch and contemporary character to market sections, category overviews, and hero cards. Structural body copy, instrument names, and general interface text use **Inter** for clean readability across compact screen layouts.

For tabular financial quotes, real-time bid/ask values, percentage change deltas, and timestamp tags, **JetBrains Mono** guarantees consistent character widths. Tabular lining numbers prevent visual jitter as quotes update dynamically. All negative percentage deltas must explicitly use the typographical minus sign (`−`) rather than an ASCII hyphen to preserve numerical baseline alignment.

## Layout & Spacing

The mobile layout operates on a compact 4-column fluid mobile grid anchored by `0.75rem` gutters and `0.75rem` canvas edge margins to maximize screen real estate on mobile devices. A strict 4px baseline rhythm governs all vertical element offsets and internal padding.

Asset tabs (Indices, Stocks, Crypto, Futures, Forex, Bonds) reside in a horizontally scrolling strip aligned directly with the canvas edge margin, incorporating `space-sm` gaps between category triggers. List view quote modules adhere to a standard 48px to 56px row height with strict 3-column data divisions: Instrument Symbol & Sub-label (left, flexible), Micro-sparkline chart (center, 64px fixed), and Last Price with Stacked Percentage Pill (right, 80px fixed).

## Elevation & Depth

Visual hierarchy does not use diffuse box-shadows or skeuomorphic blurs, which introduce visual noise and reduce rendering performance during rapid data streams. Instead, spatial depth is constructed through tonal surface stacking and crisp structural borders.

Base canvases sit at `#131722`. Cards, grouped quote tables, and module blocks rise to Level 1 (`#1e222d`), framed by a single-pixel structural hairline (`#2a2e39`). Floating bottom navigation bars, interactive modals, and sticky header bars elevate to Level 2 (`#242835`), backed by an explicit border delimiter (`#363a45`) and an ambient, low-spread drop shadow (`rgba(0, 0, 0, 0.4)` blur 12px, offset Y 4px).

## Shapes

The design system enforces a compact, technical corner radius profile (Soft - Level 1). Standard components, actionable input fields, modular cards, and market summary containers use `0.25rem` (4px) corner radii. Metric badges and status pills use a tighter `0.125rem` to `0.25rem` radius to preserve dense horizontal data spacing. Circular or pill geometries are strictly reserved for primary floating chart triggers, monogram asset icons, and segmented timeframe filters (1D, 5D, 1M, 1Y, ALL).

## Components

### Buttons & Interactive Triggers
- **Primary Action**: Solid `#2962ff` background, `#ffffff` text, 36px height, font `title-md`, rounded with 4px radii. Active tap states drop opacity to 0.85.
- **Segmented Filter Buttons**: `#1e222d` background, `#787b86` text, transitioning to `#242835` surface and `#d1d4dc` text when selected, highlighted with a bottom border indicator of 2px `#2962ff`.

### Market Badges & Percentage Pills
- **Bullish Delta**: Background `#089981` at 12% opacity, text `#089981`, font `data-mono-sm`. Always prefixed with `+` sign.
- **Bearish Delta**: Background `#f23645` at 12% opacity, text `#f23645`, font `data-mono-sm`. Always prefixed with `−` sign.
- Compact variant eliminates the pill background entirely, showing plain colored monospaced text for dense tables.

### Asset Class Navigation Tabs
- Persistent horizontal scroll bar with zero scrollbars displayed.
- Inactive tabs display `#787b86` with no background. Active asset tab is encapsulated in a `#2a2e39` chip with `#ffffff` text and a subtle 1px border.

### Quote List Row
- **Height**: 52px fixed vertical height with bottom border divider `#2a2e39` (1px).
- **Left Column**: Top line contains ticker code in `ticker-symbol` (`#d1d4dc`), bottom line contains exchange name and company descriptor in `body-sm` (`#787b86`).
- **Center Column**: Scaled SVG sparkline indicator (64px width × 24px height). Vector line stroke is 1.5px colored dynamically in either `#089981` or `#f23645` depending on period performance.
- **Right Column**: Primary trade price in `data-mono-md` (`#d1d4dc`), right-aligned above the percentage change delta pill.

### Search & Symbol Lookup Input
- 40px height, inset surface `#1e222d`, border 1px solid `#2a2e39`, font `body-md`. Left-hand search icon rendered in `#787b86`. Active focus state shifts the border to `#2962ff` without outer glow rings.