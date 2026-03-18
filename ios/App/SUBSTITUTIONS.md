# Substitutions List — FGPFT Native iOS App

This document records every place where something **other than repo content** was used (asset not in repo, system fallback, or different source).

## Audio

- **Sound effects**: All `.wav` files are included in `App/Resources/Audio/`. Files: `correct.wav`, `pass.wav`, `tick.wav`, `tock.wav`, `roundEnd.wav`, `gameEnd.wav`, `applause.wav`, `drumroll.wav`, `countdown.wav`, `buzz.wav`.

## Fonts

- **Bundled**: **Titan One** (`TitanOne-Regular.ttf`) and **Outfit** (`Outfit-VariableFont_wght.ttf`) are bundled in `App/Resources/`, registered in `Info.plist` under `UIAppFonts`, and used via `AppFonts` in Swift.

## Colors

- **Background**: Base background uses the **original web app purple**: `#1e1a2e` (from CSS `--background: 260 30% 12%`). A linear gradient is used for depth (base to base at 0.92 opacity). See `BackgroundView` in `HomeView.swift`. Accent colors (pink, cyan, purple, green, yellow) are kept from the repo.

## Copy

- All in-app strings (Settings, Categories, Summary, About, How to Play, Privacy, Terms) were taken from or closely match the copy in the repo at the time the native app was created. Minor adaptations for native UI (e.g. "Back" instead of arrow-only) follow standard iOS patterns.

## Other assets

- **App icon**: Uses the existing **Assets.xcassets/AppIcon** in the Xcode project.
- **Launch screen**: Uses the existing **LaunchScreen.storyboard** and **Assets.xcassets/LaunchImage**; no new assets added.
- **Quick Start image**: The web app’s How to Play page references `/quick-start-guide.jpg`. The native **How to Play** view does **not** include this image; the Quick Start section was omitted to avoid adding an asset not guaranteed in the repo. To add it, place the image in the asset catalog and display it in `HowToPlayView`.

---

**Summary**: Audio and copy are from the repo. Fonts (Titan One, Outfit) are bundled and registered. Background is original purple #1e1a2e with a gradient. App icon and launch screen are unchanged from the original iOS project.
