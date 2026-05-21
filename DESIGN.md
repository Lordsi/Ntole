---
name: Ntole
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#baccb0'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#ebffe8'
  on-tertiary: '#003914'
  tertiary-container: '#6cf88a'
  on-tertiary-container: '#00702e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#72fe8f'
  tertiary-fixed-dim: '#53e076'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#005320'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system for Ntole evokes a "Night City" aesthetic—sophisticated, high-energy, and unmistakably tech-forward. It is designed to feel like a premium concierge service operating within the rhythmic pulse of Malawi's urban centers.

The style is a fusion of **Dark-mode Minimalism** and **Glassmorphism**. By utilizing deep charcoal surfaces and high-frequency neon accents, the UI prioritizes visual hierarchy and reduces eye strain during night-time usage. The emotional response is one of reliability and speed, achieved through sharp contrast and glowing interactive elements that guide the user through the ride-hailing flow.

## Colors
The palette is dominated by a true-black background to maximize the efficiency of OLED screens and provide a canvas for the neon accents.

- **Primary Neon Green**: Used exclusively for primary calls to action, active route lines, and pulsing status indicators. It should appear to "emit light."
- **Deep Charcoal & Black**: These form the structural base of the UI. Surface layers use subtle gradients to distinguish depth.
- **Glassmorphism Tints**: Background blurs should use a semi-transparent white (5-10% opacity) to create the "frosted" effect over the map or background content.
- **Semantic Colors**: Use Tertiary Green for "Success," while keeping the Primary Neon reserved for "Action."

## Typography
We use **Geist** for its precision and technical clarity, reflecting the app's focus on logistics and speed. 

- **Headlines**: Use heavy weights (700-800) with tight letter spacing to create a high-impact, modern feel.
- **Body**: Standard weights (400) ensure legibility against dark backgrounds.
- **Labels & Data**: We use **JetBrains Mono** for specialized data like ETA, license plate numbers, and pricing. The monospaced nature of this font reinforces the "tech-forward" and "systematized" brand personality.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high internal padding within cards to maintain an airy, premium feel despite the dark palette.

- **Grid**: A 4-column grid for mobile and a 12-column grid for desktop.
- **Rhythm**: All spacing is derived from a 4px base unit. 
- **Safe Areas**: Maps should bleed to the edges of the screen, with UI controls (search bars, floating buttons) anchored with a 20px margin from the screen edge. 
- **Reflow**: On tablet and desktop, the ride-selection interface moves to a floating side-panel (380px fixed width) to keep the map center-stage.

## Elevation & Depth
Elevation in this design system is conveyed through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

- **Level 0**: The Map Layer. Dark-themed with saturated neon paths.
- **Level 1 (Surface)**: Main UI panels. Solid deep charcoal (#1A1A1A) with a subtle 1px border (#2A2A2A).
- **Level 2 (Floating)**: Glassmorphic cards. Use `backdrop-filter: blur(20px)` and a background color of `rgba(255, 255, 255, 0.05)`. 
- **Accents**: Important elements (like the current car location) utilize an external neon glow (`box-shadow: 0 0 15px #39FF14`) to simulate light emission.

## Shapes
The shape language is primarily **Pill-shaped (3)** for interactive elements and high-radius rounded corners for containers.

- **Buttons & Chips**: Always use fully rounded (pill) caps to denote interactivity and comfort.
- **Cards & Sheets**: Use a `2rem` (32px) corner radius on the top edges of bottom sheets to create a soft, inviting transition from the map.
- **Inputs**: Use a `1rem` (16px) radius to distinguish them from the fully circular buttons.

## Components

### Buttons
- **Primary Action**: Pill-shaped, solid Neon Green (#39FF14) background with black text. On hover/active, increase the outer glow intensity.
- **Secondary Action**: Pill-shaped, transparent background with a 1px Neon Green border.

### Glassmorphism Cards
- Used for ride details and driver profiles.
- Features a 0.5px "hairline" white border at 15% opacity to define the edge against the map.
- High backdrop blur (20px-30px) is mandatory to maintain text legibility over map labels.

### Input Stacks
- **Location Selector**: A vertical stack where "Pickup" and "Destination" are connected by a thin dotted line.
- Pickup point uses a subtle grey ring; Destination uses a solid Neon Green dot.
- Backgrounds for inputs should be slightly lighter than the base surface (#222).

### Status Badges
- Small, pill-shaped labels with a background of 10% opacity of the status color.
- **En-route**: Primary Green text + Pulsing dot.
- **Accepted**: White text + Solid Primary Green dot.

### Map Overlays
- **Route Line**: A thick (5px-8px) Neon Green line with a soft outer glow.
- **Vehicle Marker**: A stylized top-down car icon or a circular dot with a directional arrow, glowing intensely.