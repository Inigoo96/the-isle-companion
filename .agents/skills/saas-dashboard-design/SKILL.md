---
name: saas-dashboard-design
description: Design professional SaaS admin dashboards and management panels. Use this skill when improving the visual design of the admin panel — layout, typography, component library, dark gaming aesthetic, forms, tables, navigation. Targets React + CSS Modules stack.
---

This skill guides the visual redesign of The Isle Companion admin panel — a React + Vite SPA used by server administrators to configure their servers on the platform.

## Context

- **Tech stack**: React 18, React Router, CSS Modules (`.module.css` per page/component)
- **Users**: Server admins — technically savvy, not necessarily designers
- **Brand**: Dark gaming aesthetic matching the overlay (cyan `#00e5ff` accent, dark backgrounds)
- **Goal**: Look professional enough that a server admin trusts the platform and wants to use it

## Design Direction

**Aesthetic**: Dark SaaS dashboard with a gaming edge. Think: Linear.app or Vercel dashboard — clean, functional, with just enough personality. Not neon gamer RGB chaos, not sterile corporate gray.

**NOT**: Bootstrap defaults, Material UI out-of-the-box, generic white admin panels, excessive drop shadows everywhere, stock "dashboard" template vibes.

## Color System

Match the overlay's CSS variables for brand coherence:

```css
:root {
  --bg:           #0d1117;   /* page background */
  --bg-surface:   #111820;   /* card/panel background */
  --bg-surface-2: #1a2332;   /* input background, secondary surfaces */
  --border:       rgba(0, 229, 255, 0.15);
  --border-dim:   rgba(255, 255, 255, 0.07);
  --accent:       #4B75FF;
  --accent-rgb:   75, 117, 255;
  --accent-glow:  rgba(75, 117, 255, 0.35);
  --text:         #e8eaf0;
  --text-mid:     #b0bec5;
  --text-dim:     #607d8b;
  --danger:       #e06040;
  --danger-glow:  rgba(210, 80, 40, 0.35);
}
```

## Layout Principles

### Sidebar navigation
Narrow (220px) fixed sidebar with the brand logo/name at top, nav links, and user profile at bottom. Background `--bg-surface`. Active route: left accent border (`3px solid var(--accent)`) + subtle accent background.

### Main content area
Max-width ~900px centered (not full-width — long lines are unreadable). Comfortable padding (24–32px). Page title + action button at top, content below.

### Responsive consideration
The admin panel is used on desktop only — no need to prioritize mobile, but avoid breaking below 1024px.

## Component Patterns

### Page header
```
[Page title — large, --text]   [Primary action button — right aligned]
[Subtitle — --text-dim]
```
Separator: `1px solid var(--border-dim)` below header.

### Cards / list items
```css
background: var(--bg-surface);
border: 1px solid var(--border-dim);
border-radius: 8px;
padding: 16px 20px;
transition: border-color 0.15s, box-shadow 0.15s;
```
Hover: `border-color: var(--border)` + subtle `box-shadow: 0 0 12px rgba(0,229,255,0.08)`.

### Form fields
```css
label: font-size 12px, font-weight 600, color --text-dim, letter-spacing 0.05em, UPPERCASE
input: bg --bg-surface-2, border 1px solid --border-dim, border-radius 6px, padding 10px 12px
input:focus: border-color --accent, box-shadow 0 0 0 2px rgba(0,229,255,0.15), outline none
```
Group related fields in a `<fieldset>`-style section with a subtle label header.

### Buttons
- **Primary**: bg `rgba(0,229,255,0.1)`, color `--accent`, border `1px solid rgba(0,229,255,0.3)`, hover glow
- **Danger**: bg `rgba(210,80,40,0.1)`, color `--danger`, border matching, hover glow `--danger-glow`
- **Ghost**: no background, `--text-dim` color, `--border-dim` border, hover bg `rgba(255,255,255,0.04)`
- Consistent height: 36px, padding 0 16px, border-radius 6px, font-weight 500

### Dino chip selector
Grid of toggleable chips — each chip is a species name. Selected: accent background + border. Unselected: dim. Use `display: flex; flex-wrap: wrap; gap: 6px`. Chip height 28px, border-radius 4px.

### Status / meta badges
Small inline chips for showing multiplier, server status, dino count. `font-size: 11px`, `padding: 2px 8px`, `border-radius: 3px`.

## Navigation UX

- Active link: highlighted with accent left border + light accent fill
- Logout: bottom of sidebar, ghost button style, `--danger` color on hover
- Breadcrumb on forms: "Dashboard / Edit Server" — small, `--text-dim`

## Typography

```css
font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
/* Headings */
h1: 22px, font-weight 700, color --text
h2: 16px, font-weight 600, color --text
/* Body */
p:  14px, color --text-mid, line-height 1.6
/* Labels */ 
label: 11–12px, font-weight 600, color --text-dim, letter-spacing 0.06em
/* Monospace values */
code/slugs: 'Consolas', monospace, --accent color
```

## Empty States

When a list is empty (no servers), show a centered block:
- Icon or simple illustration (SVG, not emoji)
- "No servers yet" headline
- "Create your first server" CTA button
- Muted background, `border: 1px dashed var(--border-dim)`, generous padding

## What to Avoid

- White/light themes — this is a gaming platform, dark is on-brand
- Generic blue primary buttons
- `font-family: Arial, sans-serif` or unset fonts
- Table-heavy layouts (prefer card lists for server management)
- Excessive border-radius (>10px) — looks toyish
- Full-width inputs that stretch edge to edge on large screens
- Mismatched spacing — use an 8px grid (8, 12, 16, 24, 32, 48)
