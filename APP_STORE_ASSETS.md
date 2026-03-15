# App Store Assets Checklist

**App Name:** Family Guess Party Fun Time  
**Display Name (on device):** FGPFT  
**Bundle ID:** com.kjasken.familyguessparty

---

## Assets That Exist (Complete)

### App Icons
All 16 required icon sizes are present in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

| Size | Device | File |
|------|--------|------|
| 20x20 @2x | iPhone | icon-20@2x.png |
| 20x20 @3x | iPhone | icon-20@3x.png |
| 29x29 @2x | iPhone | icon-29@2x.png |
| 29x29 @3x | iPhone | icon-29@3x.png |
| 40x40 @2x | iPhone | icon-40@2x.png |
| 40x40 @3x | iPhone | icon-40@3x.png |
| 60x60 @2x | iPhone | icon-60@2x.png |
| 60x60 @3x | iPhone | icon-60@3x.png |
| 20x20 @1x | iPad | icon-20.png |
| 20x20 @2x | iPad | icon-20@2x.png |
| 29x29 @1x | iPad | icon-29.png |
| 29x29 @2x | iPad | icon-29@2x.png |
| 40x40 @1x | iPad | icon-40.png |
| 40x40 @2x | iPad | icon-40@2x.png |
| 76x76 @1x | iPad | icon-76.png |
| 76x76 @2x | iPad | icon-76@2x.png |
| 83.5x83.5 @2x | iPad Pro | icon-83.5@2x.png |
| 1024x1024 | App Store | icon-1024.png |

### Launch Screen
- Storyboard: `ios/App/App/Base.lproj/LaunchScreen.storyboard`
- Splash images in `Assets.xcassets/Splash.imageset/`

### Privacy Description
- NSMotionUsageDescription configured in Info.plist

---

## Assets Missing (Required for App Store)

### Screenshots

| Device | Resolution | Quantity | Status |
|--------|------------|----------|--------|
| iPhone 6.7" (iPhone 15 Pro Max) | 1290 x 2796 px | 3-10 | **MISSING** |
| iPhone 6.5" (iPhone 14 Plus) | 1284 x 2778 px | 3-10 | **MISSING** |
| iPhone 5.5" (iPhone 8 Plus) | 1242 x 2208 px | 3-10 | **MISSING** |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 px | 3-10 | **MISSING** |

### Recommended Screenshot Scenes
1. Home screen with category selection
2. Game in progress (word displayed, timer running)
3. Tilt gesture demonstration
4. Round summary with scores
5. Study mode with flashcard
6. Settings screen
7. Team scoreboard
8. Category management

### App Store Connect Metadata

| Field | Max Length | Status |
|-------|------------|--------|
| App Name | 30 chars | "Family Guess Party Fun Time" |
| Subtitle | 30 chars | "A fun, interactive party guessing game and study tool for the whole family!"|
| Description | 4000 chars | "Get ready for a fun time with Family Guess Party Fun Time! Guesser holds the phone to their forehead while others give clues. Tilt forward when you guess correctly, tilt back to pass!

No ads. No in-app purchases or subscriptions. 
No data collection. 
You buy it. 
It's yours. 
And you can customize words and categories as much as you'd like.


GAME MODE for classic family fun
STUDY MODE learning on the go

Features:
• 25+ built-in categories with 2,000+ words
• Customizable word lists — create your own and customize the built in categories
• Adjustable timer and round settings
• Team mode with score tracking and custom team names
• Intuitive tilt controls or on-screen buttons — your choice
• Works great on iPhone and iPad (Study mode)

Perfect for:
• Family game nights
• Birthday parties
• Road trips
• Team building events
• Holiday gatherings
• Language learning & vocabulary practice
• Classroom review & study sessions
• Test prep & flashcard drills

© 2025 K Jasken and Associates LLC. Family Guess Party Fun Time is a trademark of K Jasken and Associates LLC." |

| Keywords | 100 chars | game, party game, family, charades, heads up, trivia, word game, study, flashcards, vocabulary |
| Privacy Policy URL | URL | https://meeesterj.github.io/FGPFT/privacy.html |
| Support URL | URL | https://meeesterj.github.io/FGPFT/terms.html|


### Optional Assets

| Asset | Status |
|-------|--------|
| App Preview Video (15-30 sec) | Optional, recommended |

---

## Manual Screenshot Capture Guide (Xcode Simulator)

### Setup
1. Open `ios/App/FGPFT.xcodeproj` in Xcode
2. Select a simulator matching your target device size
3. Build and run the app (Cmd+R)

### Capture Steps
1. Navigate to the screen you want to capture
2. Press **Cmd+S** in the Simulator (saves to Desktop)
3. Or use **File > Save Screen** in Simulator menu

### Required Simulator Devices
- iPhone 15 Pro Max (6.7" - 1290x2796)
- iPhone 14 Plus or 15 Plus (6.5" - 1284x2778)
- iPhone 8 Plus (5.5" - 1242x2208)
- iPad Pro 12.9" 6th gen (2048x2732) - for Study Mode screenshots

### Tips
- Set **Simulator > Device > Show Device Bezels** off for clean screenshots
- Use **Cmd+Shift+2** to toggle light/dark appearance
- Screenshots save as PNG at exact device resolution
- Capture 3-10 screenshots per device size

---

## Suggested App Store Description

```
Family Guess Party Fun Time is the ultimate party guessing game and study tool!

GAME MODE
- Hold your phone to your forehead while friends give you clues
- Tilt forward for correct, tilt back to pass
- Compete in teams with customizable rounds and timers
- 27 built-in categories with 2,200+ words

STUDY MODE
- Perfect for language learning and flashcard review
- Formatted cards with helper text and hidden answers
- Tap to reveal answers
- Great for vocabulary, geography, history, and more

FEATURES
- Tilt gestures or on-screen buttons
- 1-5 teams with customizable names
- Sound effects and haptic feedback
- Create your own custom word lists
- CSV import support
- Works offline - no account required

CATEGORIES INCLUDED
- Charades (Actions, Food, Animals)
- Animals (Easy, Medium, Hard)
- Languages (Mandarin, Vietnamese, Spanish)
- Education (Geography, Chemistry, History, Space)
- And many more!

Perfect for family game night, parties, road trips, and classroom learning!
```

---

## Suggested Keywords (100 chars max)
```
charades,party game,trivia,flashcards,language learning,family game,guessing game,study
```

---

## Next Steps
1. [ ] Create Privacy Policy webpage and get URL
2. [ ] Create Support webpage and get URL
3. [ ] Capture screenshots on all required device sizes
4. [ ] Write final app description and subtitle
5. [ ] Complete App Store Connect questionnaire (age rating, etc.)
6. [ ] Submit for review
