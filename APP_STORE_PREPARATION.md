# App Store Preparation Guide
## Family Guess Party Fun Time™

This document outlines the steps to publish your app to the Apple App Store.

---

## What's Already Done ✓

### Code Optimization
- Native iOS app is self-contained (SwiftUI) with on-device persistence

### iOS Assets Generated
- **App Icon Set** (`ios-assets/AppIcon.appiconset/`)
  - All required iOS icon sizes (20pt through 1024pt)
  - Ready to copy into Xcode project
  
- **Launch Screen Reference Images** (`ios-assets/LaunchImage/`)
  - iPhone and iPad splash screen examples with app logo
  - Dark background (#0c0a1a) matching app theme
  - **Note**: Modern iOS uses `LaunchScreen.storyboard`. These PNGs are reference images for the storyboard design.

### Configuration Files
- **Privacy Policy & Terms** - Legal pages included (see `docs/`)

---

## Next Steps For You

### 1. Set Up Local Development Environment
Install Xcode from the Mac App Store.

### 2. Open the iOS Project
Open `ios/App/FGPFT.xcodeproj` in Xcode.

### 3. Configure Xcode Project
1. **Copy app icons**: Drag `ios-assets/AppIcon.appiconset/` folder into `ios/App/App/Assets.xcassets/`
2. **Copy launch images**: Add `ios-assets/LaunchImage/` to Assets.xcassets
3. **Set Bundle Identifier**: `com.kjasken.familyguessparty`
4. **Set Display Name**: "Family Guess Party Fun Time"
5. **Configure Team**: Add your Apple Developer account
6. **Set Deployment Target**: iOS 14.0 or later recommended

### 4. Code Signing
1. Create an App ID in Apple Developer Portal
2. Create provisioning profiles (Development & Distribution)
3. Configure signing in Xcode → Signing & Capabilities

### 5. App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with Bundle ID: `com.kjasken.familyguessparty`
3. Fill in app information:
   - **Name**: Family Guess Party Fun Time
   - **Subtitle**: Party Game & Study Tool with Tilt Controls
   - **Category**: Games → Party (secondary: Education)
   - **Age Rating**: 4+ (no objectionable content)
   - **Copyright**: © 2025 K Jasken and Associates, LLC

### 6. App Store Screenshots
You'll need screenshots for:
- iPhone 6.7" (1290 x 2796 pixels) - iPhone 15 Pro Max
- iPhone 6.5" (1284 x 2778 pixels) - iPhone 14 Plus
- iPhone 5.5" (1242 x 2208 pixels) - iPhone 8 Plus
- iPad Pro 12.9" (2048 x 2732 pixels)

**Tip**: Use the iOS Simulator to capture screenshots at each size.

### 7. App Description (Suggested)

**Short Description:**
Party guessing game & study tool for families and friends!

**Full Description:**
Get ready for endless fun with Family Guess Party Fun Time! One player holds the phone to their forehead while others give clues. Tilt forward when you guess correctly, tilt back to pass!

GAME MODE — 22 built-in categories for classic party fun:
Charades, animal packs, ocean life, geography, household objects, holidays, and more.

STUDY MODE — 9 study categories for learning on the go:
Chemistry, US history, landforms, human body, space, ancient world, geopolitics, pioneers, mythology. Study cards support helper text and hidden answers for self-quizzing.

Features:
• Intuitive tilt controls or on-screen buttons — your choice
• 31 built-in categories with 2,112+ words
• Study Mode with formatted cards, helper text, and answer reveals
• Customizable word lists — create your own or import from CSV
• Adjustable timer and round settings
• Team mode with score tracking and winner declarations
• Beautiful, high-contrast display optimized for party environments
• Sound and haptic feedback (auto-configured per mode)
• Works great on iPhone and iPad

Perfect for:
• Family game nights
• Birthday parties
• Road trips
• Team building events
• Holiday gatherings
• Language learning & vocabulary practice
• Classroom review & study sessions
• Test prep & flashcard drills

No ads, no in-app purchases — just pure fun and learning!

**Keywords:**
guessing game, party game, family game, charades, heads up, trivia, word game, study, flashcards, vocabulary, language learning

### 8. TestFlight Beta Testing
1. Archive your app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Add internal testers (up to 100)
4. Test thoroughly on multiple devices

### 9. Submit for Review
1. Complete all App Store listing information
2. Upload screenshots for all device sizes
3. Set pricing (Free or Paid)
4. Submit for App Review (typically 24-48 hours)

---

## App Review Guidelines Checklist

✓ **Privacy**: Privacy Policy page included  
✓ **Content**: No objectionable content (4+ rating appropriate)  
✓ **Functionality**: All features work without internet  
✓ **UI**: Optimized for mobile, no broken layouts  
✓ **Performance**: Smooth animations, no crashes  
✓ **Legal**: Copyright and trademark properly displayed  

### Potential Review Concerns
- **Motion sensors**: The app uses device orientation for tilt gestures. Apple may ask why - explain it's core gameplay.
- **Haptics**: Using standard haptic patterns is fine.
- **Audio**: Silent audio unlock technique is acceptable for web-based apps.

---

## Estimated Timeline

| Step | Duration |
|------|----------|
| Xcode setup | 1-2 hours |
| Code signing & profiles | 1-2 hours |
| App Store Connect setup | 1 hour |
| Screenshot creation | 2-3 hours |
| TestFlight testing | 1-7 days |
| App Review | 1-3 days |
| **Total** | **1-2 weeks** |

---

## Support Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)

---

© 2025 K Jasken and Associates, LLC
