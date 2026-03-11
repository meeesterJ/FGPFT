# Substitutions List — FGPFT Native iOS App

This document records every place where something **other than repo content** was used (asset not in repo, system fallback, or different source).

## Audio

- **Sound effects**: All `.wav` files were **copied from the repo** at `client/public/audio/` into `App/Resources/Audio/`. Files: `correct.wav`, `pass.wav`, `tick.wav`, `tock.wav`, `roundEnd.wav`, `gameEnd.wav`, `applause.wav`, `drumroll.wav`, `countdown.wav`, `buzz.wav`. No substitutions; source is the same as the web app.

## Fonts

- **Display/Title**: The plan specifies Outfit (body) and Titan One (display). **Titan One** and **Outfit** are not yet bundled in the iOS app. The app uses **system fonts** (e.g. `.system(size:weight:)`) for all text. To match the web app, add the font files to the project, register them in Info.plist under "Fonts provided by application", and use e.g. `.font(.custom("TitanOne", size: 36))` and `.font(.custom("Outfit", size: 17))`.

## Colors

- **Background**: Base background uses **#3A4D63** (slate blue-gray) as specified. A **linear gradient** is used for depth: from `#3A4D63` to `#3A4D63` at 0.85 opacity (see `BackgroundView` in `HomeView.swift`). Accent colors (pink, cyan, purple, green, yellow) are kept from the repo and defined in `AppColors` and `TeamThemeColor` where used.

## Copy

- All in-app strings (Settings, Categories, Summary, About, How to Play, Privacy, Terms) were taken from or closely match the copy in the repo (`client/src/pages/`). No intentional rewordings. Minor adaptations for native UI (e.g. "Back" instead of arrow-only) are consistent with standard iOS patterns.

## Other assets

- **App icon**: Uses the existing **Assets.xcassets/AppIcon** in the Xcode project; no change from the Capacitor setup. If the repo did not include a custom icon, the placeholder from the original project remains.
- **Launch screen**: Uses the existing **LaunchScreen.storyboard** and **Assets.xcassets/LaunchImage**; no new assets added.
- **Quick Start image**: The web app’s How to Play page references `/quick-start-guide.jpg`. The native **How to Play** view does **not** include this image; the Quick Start section was omitted to avoid adding an asset not guaranteed in the repo. To add it, place the image in the asset catalog and display it in `HowToPlayView`.

---

**Summary**: Audio and copy are from the repo. Fonts use system fallback until Outfit and Titan One are bundled. Background is #3A4D63 with a gradient. App icon and launch screen are unchanged from the original iOS project.
