# FGPFT design theme reference

Use this document to match **fonts**, **colors**, and **layout** when building another app in the same visual style. Values below are taken from the iOS SwiftUI sources (see **Source of truth** at the end).

---

## Visual direction

- **Dark, saturated “party” UI** on a deep violet-black base.
- **Accent palette** maps to Tailwind-style “400” brights (pink, cyan, yellow, green, purple); comments in code refer to `text-pink-400`, `text-cyan-400`, etc.
- **High contrast**: white and near-white text on dark backgrounds; colored borders and fills for hierarchy and state.
- **Rounded rectangles** (often **12pt** radius, **continuous** style on cards) and **capsule** toolbars/buttons.

---

## Typography

| Role | Font | Usage |
|------|------|--------|
| **Display / headlines** | **Titan One** | Large titles, menu word stack (“Family”, “Guess”, …), game word, “Round” / “Study” multicolor labels, section chrome where `AppFonts.display` is used. |
| **Body / UI** | **Outfit** (variable weight TTF) | Buttons, settings, lists, timers (with `.monospacedDigit()` where needed), most labels. |
| **Icons** | **SF Symbols** | Only with **system** font sizing via `AppFonts.sfSymbol(size:)` — do not use custom fonts for SF Symbols. |

**Bundled files** (registered in `Info.plist` under `UIAppFonts`):

- `Outfit-VariableFont_wght.ttf`
- `TitanOne-Regular.ttf`

**Licensing**: Google Fonts — [Outfit](https://fonts.google.com/specimen/Outfit), [Titan One](https://fonts.google.com/specimen/Titan+One) (SIL Open Font License). See `README.md`.

**Implementation note**: PostScript names are resolved at runtime (`Outfit` / `Outfit-Thin_Regular` / `Outfit-Regular`, and `Titan One` / `TitanOne-Regular`) for compatibility with the variable font.

**Typical sizes** (pt; many scale **compact vs iPad** via `LayoutAdaptation`):

- Screen titles: **44** (phone) / **58** (pad)
- Main menu buttons: **18** bold (Outfit)
- Settings mode toggle / rows: **15** medium; section headers: **20** display / **22** display in nav
- Categories toolbar: **14** medium (minimum scale **0.88**, `lineLimit(1)`)
- Game word: **180** / **230** display; timer: **120** / **160** display; body lines **16–28** depending on context
- Splash tagline: **20** body
- App capsule buttons: **15** medium, **14** horizontal / **10** vertical padding

**Dynamic Type**: Outfit supports `AppFonts.body(baseSize:textStyle:)` for scaled body text (e.g. category editor).

---

## Colors

### Base & surfaces

| Token / usage | Value | Notes |
|---------------|-------|--------|
| **App background** | `#140A24` | `BackgroundView`: vertical gradient from solid to **92% opacity** same color (subtle flatten toward bottom). |
| **Bar / chrome** | `#140A24` at **92% opacity** | Navigation toolbar background (`AppColors.barBackground`). |
| **Inputs / text fields** | `#140A24` | `AppColors.inputBackground`. |
| **Glass panels** | `white` **5–8%** opacity | List/card strips (`Color.white.opacity(0.05)` / `0.06` / `0.08`). |
| **Home button circle** | `white` **15%** opacity | Circular hit target on dark overlay. |

### Core accent colors (`AppColors`)

| Name | Hex / definition | Typical use |
|------|------------------|-------------|
| **pink** | `#f472b6` | Game mode emphasis, pass/wrong, toggles, links/tint in many flows |
| **cyan** | `rgb(33, 212, 237)` *(0.13, 0.83, 0.93)* | Study mode, categories selection, “Round” letter “R”, cool accents |
| **purple** | `rgb(166, 140, 250)` *(0.65, 0.55, 0.98)* | Section outlines, multicolor “d” |
| **green** | `rgb(74, 222, 128)` *(0.29, 0.87, 0.5)* | Correct, timer OK state, positive counts |
| **yellow** | `rgb(250, 204, 23)` *(0.98, 0.8, 0.09)* | Headings (“Game Over”, scores), timer label, crowns, highlights |
| **destructive** | `#e84a6f` | Destructive actions |
| **primaryPurple** | `#9333ea` | Settings title, toggles, primary accent UI |
| **howToPlayGold** | `#ca8a04` | “How to Play” / sort affordances (amber-gold) |

### Text on dark

| Token | Value |
|-------|--------|
| **textPrimary** | `white` |
| **textSecondary** / **mutedText** | `white` **70%** opacity |
| **textTertiary** | `white` **50%** opacity |

Prefer these over SwiftUI `.primary` / `.secondary` on app backgrounds.

### Title word colors (main menu stack)

Words use display font with per-word color (aligned with Tailwind 400 palette):

| Word | Hex |
|------|-----|
| Family | `#f472b6` |
| Guess | `#22d3ee` |
| Party | `#facc15` |
| Fun | `#4ade80` |
| Time | `#a78bfa` |

**Title treatment**: soft shadow `black` **30%**, radius **4**, offset **(0, 2)**; whole stack rotated **-2°**.

### Main menu buttons (`MenuButtonStyle`)

Filled **500-ish** body with **400** border (**2pt**), **12pt** corner radius, white label text:

| Button | Fill | Border |
|--------|------|--------|
| Play Now | `#ec4899` | `#f472b6` |
| Categories | `#0891b2` | `#22d3ee` |
| Settings | `#9333ea` | `#a78bfa` |
| How to Play | `#ca8a04` (howToPlayGold) | `#facc15` |

Pressed: **0.98** scale.

### Team theme colors (`TeamThemeColor`)

Cycling palette for teams (text / solid bg / border reference):

| Team accent | Text | Background (solid) | Border (conceptual) |
|-------------|------|----------------------|---------------------|
| pink | `#f472b6` | `#831843` | `rgba(244,114,182,0.3)` |
| cyan | `#22d3ee` | `#164e63` | `rgba(34,211,238,0.3)` |
| purple | `#a78bfa` | `#581c87` | `rgba(167,139,250,0.3)` |
| green | `#4ade80` | `#14532d` | `rgba(74,222,128,0.3)` |
| yellow | `#facc15` | `#713f12` | `rgba(250,204,21,0.3)` |

UI often uses the **text** hex for `foregroundStyle` and the **bg** hex at **~40% opacity** for row fills.

### Settings mode toggle

- Segmented control in a **12pt** rounded rect, **purple** stroke **40%** opacity, **1pt**.
- **Game** selected: **pink** fill **25%** opacity; **Study** selected: **cyan** fill **25%** opacity; unselected side uses muted text.

### Multicolor “Round” / “Study”

Letter colors in order: **cyan → pink → yellow → green → purple** (`AppColors` order as in `MulticoloredRoundText` / `MulticoloredStudyText`).

---

## Layout & spacing

### Device adaptation (`LayoutAdaptation`)

- **`isPad`**: `UIDevice` idiom pad.
- **`value(compact:pad:)`**: choose numeric token per form factor (used for font sizes, padding, radii throughout).
- **`contentMargin(compact:pad:)`**: default horizontal content inset **32** phone / **24** pad (splash uses **28** phone / **0** pad horizontal for title).
- **`homeButtonExtraInsets`**: **10** phone / **0** pad — extra leading/top inset for the floating home control.

### Common spacing patterns

- **Screen edges**: **32 / 44** (phone/pad) horizontal on several full screens; score/summary variants **24–32**.
- **Vertical section rhythm**: spacers **20–36** on home; safe area + **8–32** top/bottom on game flows.
- **Card / row corner radii**: **8–12** compact, up to **14–20** on pad; leader rows may use larger **cornerR** with **continuous** rounded rect.
- **Stroke widths**: **1**, **1.5**, or **2** for outlines (selection and emphasis).
- **Categories toolbar capsules**: **min height 44**, **12** horizontal / **10** vertical padding; sort button uses plain opacity press (**0.88**).
- **App capsule button** (`AppCapsuleButtonStyle`): **14** horizontal / **10** vertical padding, capsule clip, press **0.88** opacity.

### Home layout

- **Portrait**: title area height ≈ **44%** of screen height; bottom padding **24** for buttons; outer **28** top / **36** bottom; menu `VStack` spacing **12**.
- **Landscape**: title ~**50%** content width, buttons column **min(260, 40% of content width)**; horizontal spacing **2× edgePadding** between columns; iPhone caps inner width **680** with centering.
- **Splash**: title uses **72% × 90%** of height for sizing hook; `TitleStackView` scales display size as `min(120, max(40, availableHeight / 5.4))`, line spacing `max(6, height/24)`.

### Game / overlay

- Home control: **44×44** point tappable area, **16** + safe area + `homeButtonExtraInsets` from edges.

---

## Motion (optional polish)

- Splash title lines: staggered spring **response 0.6**, **damping 0.62**, **0.16s** delay per line, slide from **-90** pt.

---

## Source of truth in this repo

| Concern | Primary files |
|---------|----------------|
| Fonts & shared colors / button styles | `ios/App/App/Utilities/AppTheme.swift` |
| Team palette | `ios/App/App/Models/TeamScore.swift` |
| Background gradient | `ios/App/App/Views/SharedComponents/BackgroundView.swift` |
| Layout helpers | `ios/App/App/Utilities/LayoutAdaptation.swift` |
| Menu + title colors | `ios/App/App/Views/HomeView.swift` |
| Multicolor headings | `ios/App/App/Views/SharedComponents/MulticoloredText.swift` |
| Font registration | `ios/App/App/Info.plist` (`UIAppFonts`) |

If this document and the code disagree, **trust the code** (or update this file to match after intentional design changes).
