# FGPFT design tokens

Portable tokens derived from [`THEME.md`](../THEME.md) and `ios/App/App/Utilities/AppTheme.swift`.

## Figma file

**[FGPFT Design System](https://www.figma.com/design/w62EdF4llHguxvrrj9NDJu)** (`fileKey`: `w62EdF4llHguxvrrj9NDJu`)

### Build status (run `dsb-fgpft-20260531`)

| Phase | Status |
|-------|--------|
| Primitives collection (17 colors) | Done |
| FGPFT Color semantic aliases (33 tokens) | Done |
| Spacing (11) + Radius (4) collections | Done |
| Text styles (8 — Titan One + Outfit) | Done |
| Cover, Getting Started, Foundations pages | Done |
| Menu Button (4 variants) | Done |
| App Capsule Button (3 variants) | Done |
| Categories Toolbar Capsule, Team row | Not yet |

To extend the library:

> Continue FGPFT design system build. Run ID: `dsb-fgpft-20260531`. File key: `w62EdF4llHguxvrrj9NDJu`.

## Import into Figma

1. Install [Tokens Studio for Figma](https://tokens.studio/) (or similar).
2. Sync `theme.tokens.json` into Variables, or finish the in-file library via `figma-generate-library`.
3. Install fonts in Figma: **Outfit**, **Titan One** (bundled in `ios/App/App/Resources/`).

## Use in other projects

- **Web**: map tokens to CSS custom properties (`--color-accent-pink`, etc.).
- **iOS**: copy `AppTheme.swift` + fonts, or generate Swift from this JSON.
- **Figma**: prefer Variables in the design system file above once the build completes.
