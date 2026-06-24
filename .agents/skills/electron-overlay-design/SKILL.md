---
name: electron-overlay-design
description: Design and style Electron desktop overlays and gaming HUDs. Use this skill when improving the visual design of the overlay app — layout, colors, typography, component styling, dark theme, compact UI for on-screen overlays that sit on top of games.
---

This skill guides design decisions for the Electron overlay in The Isle Companion. The overlay floats over a running game window — it must be visually clear, compact, non-intrusive, and match a gaming aesthetic.

## Context

- **Platform**: Electron BrowserWindow, transparent + frameless, always-on-top
- **Audience**: Players who need quick glances at data without leaving the game
- **Constraint**: Must not block gameplay — every pixel of height matters
- **Tech**: Vanilla HTML/CSS/JS (no framework in renderer), CSS custom properties for theming
- **Current palette**: `--accent: #4B75FF` (sky blue), dark surface with blue tint (`rgba(8,10,22,...)` family), transparent backgrounds via `rgba()`

## Design Principles for Gaming Overlays

### Compactness first
Every component must justify its vertical space. Use tight padding (4–8px vertical), small font sizes (10–12px for secondary info, 13–14px max for primary), and collapsible or tabbed sections. No wasted whitespace.

### Dark theme — non-negotiable
Pure dark backgrounds (`#0d1117`, `#111820`) with low-opacity surface layers (`rgba(255,255,255,0.04)`). Never use white or light backgrounds. Text hierarchy: bright white for primary values, `--text-mid` (#b0bec5) for labels, `--text-dim` (#607d8b) for hints.

### Accent color discipline
The cyan accent (`#00e5ff`) should be used sparingly — active states, key values, progress fills, glows. Don't paint everything cyan. Muted/dimmed surfaces contrast the accent naturally.

### Readability at a glance
Players look at the overlay for under 2 seconds. Key information (coordinates, HP, current dino, timer countdown) must be immediately readable at 12–13px in a monospace font. Use `font-family: 'Consolas', monospace` for numeric data — it aligns digits and feels technical.

### Glow effects — controlled
Subtle `box-shadow` and `text-shadow` with `var(--accent-glow)` on interactive elements and active badges. Don't glow everything — pick 1–2 focal elements per section.

### No decorative chrome
Avoid heavy borders, gradient headers, icons that don't add information, or decorative separators. The game behind the overlay IS the background — keep the overlay glass-like and purposeful.

## Component Patterns

### Tabs
Minimal pill tabs: no background on inactive, accent underline or background on active. Height ≤ 28px.

### Badges / status chips
Inline `border-radius: 3px` chips with `rgba(accent, 0.1)` background and `1px solid rgba(accent, 0.3)` border. Use for server name, tier, active zone.

### Inputs
Dark `var(--bg-surface-2)` background, `1px solid var(--border)` border, 6px vertical padding to match button height. Monospace font for numbers. No visible label if the context is obvious.

### Buttons
Two tiers:
- **Primary** (Start, confirm): accent color text, `rgba(accent, 0.1)` bg, accent border, glow on hover
- **Destructive** (Reset, stop): orange-red (`#e06040`), `rgba(210,80,40,0.12)` bg, matching border and hover glow

### Progress bars
Thin (6–8px height), `border-radius: 4px`, fill color matches context: cyan for growth, green for prime progress. Track is `rgba(255,255,255,0.06)`.

### Cards / list items
`rgba(255,255,255,0.03)` background, `1px solid var(--border-dim)` border, `border-radius: 6px`, 8–10px padding. Hover lifts to `rgba(255,255,255,0.06)`.

## Layout Structure

```
[Titlebar — drag handle, Steam user, hotkey hints]     ← always visible, 32px
[Server bar — dropdown + multiplier badge]              ← always visible, 32px
[Tab nav]                                               ← always visible, 28px
[Dino selector bar]                                     ← always visible, 34px
[Tab content — scrollable if needed]                    ← dynamic
```

Keep total height under ~520px so the overlay doesn't cover most of a 1080p screen.

## What to Avoid

- White backgrounds or light mode
- Generic Bootstrap/Material look (rounded-xl cards, blue primary buttons, gray inputs)
- Emoji or decorative icons unless they're functional
- Font sizes above 14px outside headings
- Animations that distract from the game (keep transitions under 150ms)
- Horizontal scrollbars (always fit content to the overlay width)
