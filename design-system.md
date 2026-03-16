# Whitespace — Design System
Version 1.0

## Brand Identity
**Professional, Trustworthy, Institutional, and Clean.**
Whitespace is a coordination intelligence platform for civil society. The design must convey authority, clarity, and reliability. It should feel like a high-end institutional tool (think UN, World Bank, or premium data platforms).

## Color Palette
Derived from a modernized institutional palette with a nod to Nigerian national colors (Green).

| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--color-primary` | `#059669` | Emerald 600 - Primary brand color, trust, growth. |
| `--color-primary-dark` | `#047857` | Emerald 700 - Hover states for primary elements. |
| `--color-accent` | `#3b82f6` | Blue 500 - Secondary actions, links, info states. |
| `--color-background` | `#f8fafc` | Slate 50 - Main page background. |
| `--color-surface` | `#ffffff` | White - Card and panel backgrounds. |
| `--color-surface-alt` | `#f1f5f9` | Slate 100 - Section backgrounds, subtle contrast. |
| `--color-text-primary` | `#0f172a` | Slate 900 - Headings and primary body text. |
| `--color-text-secondary`| `#475569` | Slate 600 - Muted text, labels, descriptions. |
| `--color-text-inverse` | `#ffffff` | White - Text on dark/colored backgrounds. |
| `--color-border` | `#e2e8f0` | Slate 200 - Default borders and dividers. |
| `--color-border-focus` | `#059669` | Emerald 600 - Focus rings. |
| `--color-success` | `#10b981` | Emerald 500 - Success states. |
| `--color-warning` | `#f59e0b` | Amber 500 - Warning states. |
| `--color-error` | `#ef4444` | Red 500 - Error states. |

### Map Visualization Palette (Risk/Intensity)
As specified in Section 7.4 of the PRD:
- **Low (0.0):** `#2DC653` (Green)
- **Low-Mid (0.25):** `#F4E04D` (Yellow)
- **Mid (0.50):** `#F4A261` (Orange)
- **High (0.75):** `#E63946` (Red)
- **Critical (1.0):** `#6B0504` (Dark Red)

## Typography
- **Headings:** `Space Grotesk` - Tech-forward, geometric, authoritative.
- **Body:** `Inter` - Highly legible, professional, clean.
- **Data/Mono:** `JetBrains Mono` - Precise, technical.

### Type Scale
- `--text-xs`: 0.75rem / 1rem
- `--text-sm`: 0.875rem / 1.25rem
- `--text-base`: 1rem / 1.5rem
- `--text-lg`: 1.125rem / 1.75rem
- `--text-xl`: 1.25rem / 1.75rem
- `--text-2xl`: 1.5rem / 2rem
- `--text-3xl`: 1.875rem / 2.25rem
- `--text-4xl`: 2.25rem / 2.5rem

## Spacing & Layout
- **Base Grid:** 4px
- **Radius:** `rounded-lg` (8px) for cards, `rounded-full` for pills.
- **Shadows:** `shadow-sm` for cards, `shadow-md` for floating elements.
- **Max Width:** `max-w-7xl` (1280px) for content.

## Component Patterns
- **Buttons:** Solid primary for main actions, outlined for secondary.
- **Cards:** White surface with subtle border and shadow.
- **Inputs:** Clean slate borders, emerald focus rings.
- **Navigation:** Top-bar with institutional logo and clear active states.

## Animation & Motion
- **Transitions:** `150ms ease-in-out` for hover states.
- **Page Transitions:** Subtle fade-in for new views.
- **Map Interactivity:** Smooth zooming and panning via MapLibre.

## Iconography
- **Library:** `lucide-react`
- **Style:** Thin/Medium stroke (2px), slate-600 color by default.

## Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
