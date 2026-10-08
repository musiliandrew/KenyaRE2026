---
name: Institutional Insurance & Catastrophe Risk Intelligence
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#43474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#49607e'
  primary: '#000f22'
  on-primary: '#ffffff'
  primary-container: '#0a2540'
  on-primary-container: '#768dad'
  inverse-primary: '#b0c8eb'
  secondary: '#bb0027'
  on-secondary: '#ffffff'
  secondary-container: '#e0283c'
  on-secondary-container: '#fffbff'
  tertiary: '#040e1e'
  on-tertiary: '#ffffff'
  tertiary-container: '#192435'
  on-tertiary-container: '#808ba0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#b0c8eb'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#314865'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#d8e3fa'
  tertiary-fixed-dim: '#bcc7dd'
  on-tertiary-fixed: '#111c2c'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Public Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a rigorous, authoritative aesthetic tailored for institutional insurance, reinsurance, and complex catastrophe risk intelligence platforms. The brand personality is grounded, reliable, and analytical, evoking absolute trust and analytical precision.

### Personality & Target Audience
- **Target Audience:** Actuaries, risk analysts, underwriters, and institutional financial stakeholders who manage high-stakes exposure data.
- **Emotional Response:** Reassurance, clarity, intellectual command, and systemic safety.
- **Design Style:** Corporate / Modern, blending clean institutional utility with high-contrast data visualization capabilities, sharp geometric structures, and refined whitespace.

## Colors

The palette is anchored by deep navy blue for primary institutional weight, energized by a sharp crimson/maroon accent for critical catastrophe alerts and focal points. Slate grays organize structural hierarchies, while clean neutral off-whites maximize data legibility in dense actuarial dashboards.

- **Primary:** Deep Navy Blue (`#0A2540`)
- **Secondary / Accent:** Crimson / Maroon (`#C8102E`)
- **Tertiary:** Slate Gray (`#4A5568`)
- **Neutral Background:** Light Institutional Gray (`#F4F6F9`)

## Typography

Public Sans provides an accessible, clear, and institutional voice essential for dense financial tables, exposure maps, and risk telemetry. The type scale relies on strict proportional sizing to establish immediate hierarchy across complex multi-panel analytical screens.

## Layout & Spacing

A structured 12-column fluid grid system is utilized to organize high-density financial data, map interfaces, and telemetry modules. 

- **Gutters & Margins:** Generous grid gutters (24px) paired with outer canvas margins (32px) maintain breathing room around dense tabular datasets.
- **Breakpoints:** Adaptive reflow occurs at standard institutional thresholds: mobile (<768px), tablet (768px - 1200px), and desktop (>1200px), where multi-pane risk modeling layouts lock into fixed structural columns.

## Elevation & Depth

Depth is conveyed through precise tonal layering and low-contrast outlines ("ghost borders") rather than heavy, distracting drop shadows. 

- **Surfaces:** Use tiered surface-container colors to separate floating telemetry panels from canvas backgrounds.
- **Borders:** Crisp, 1px structural borders in slate gray establish strict card boundaries and table grids, supporting the analytical clarity required for actuarial work.

## Shapes

A controlled, professional shape language utilizes soft rounding (`0.25rem` base radius) for inputs, cards, and interactive elements. This prevents excessive playfulness while avoiding harsh 0px corners, projecting modern corporate restraint.

## Components

### Buttons
- **Primary:** Deep navy fill with high-contrast white text, subtle hover darkening, and sharp focus rings.
- **Secondary:** Slate gray outline or filled surface container for auxiliary actions.
- **Destructive/Critical:** Crimson fill reserved strictly for high-risk overrides or critical incident triggers.

### Chips & Badges
- Compact status indicators utilizing soft tinted backgrounds with solid text/border accents (e.g., green for nominal exposure, crimson for severe catastrophe alert).

### Lists & Tables
- Dense, highly structured data tables with alternating row shading, sticky headers, and right-aligned numerical data for actuarial comparison.

### Checkboxes & Radio Buttons
- Crisp square and circular selections with clear check/dot states in primary navy, designed for dense policy configuration forms.

### Input Fields
- Labeled, bordered input containers with clear validation states, helper text below, and monospace font integration for numerical risk parameters.

### Cards
- Container surfaces featuring 1px subtle slate borders, clean header dividers, and internal padding optimized for metric summaries and risk exposure charts.