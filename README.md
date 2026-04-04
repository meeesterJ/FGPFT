Family Guess Party Fun Time (FGPFT) is a mobile-friendly party guessing game and study tool, featuring tilt gestures, customizable word lists, team scoring, and Study Mode for language learning and flashcard review.

## Project Overview
FGPFT delivers an interactive guessing game and learning tool built as a native iOS app. Players hold the phone to their forehead while others give clues — tilt forward for correct, tilt back to pass. Study Mode turns the same format into a flashcard-style review tool with helper text and hidden answers. The app launches with 27 curated categories (9 game, 18 study) totaling 2,201 words.

## Key Features
- Tilt-based gesture controls or on-screen buttons — your choice
- 27 built-in categories across Game Mode and Study Mode
- Study Mode with formatted cards, helper text (in parentheses), and hidden answers (in brackets) revealed on tap
- Team mode with 1-5 teams, per-round scoring, and winner declarations
- Customizable word lists with CSV import support
- Soft-delete and permanent delete for built-in categories
- Configurable timer and round settings (including untimed mode)
- Sound and haptic feedback (auto-configured per mode)
- Responsive design optimized for mobile

## Game Mode Categories (9)
Charades - Actions, Charades - Food & Snacks, Charades - Animals, Animals - Easy, Animals - Medium, Animals - Hard, Household Objects, Christmas Kids Party, Family Fun

## Study Mode Categories (18)
US Geography, World Geography, Mandarin, Mandarin-Beginner, Mandarin-Intermediate, Vietnamese-Beginner, Vietnamese-Intermediate, Spanish-Beginner, Spanish-Intermediate, Chemistry, US History, Landforms, Human Body, Space, Ancient World, Geopolitics, Pioneers, Mythology

## Default Settings
- Mode: Game Mode
- Timer: 30 seconds per round
- Rounds: 3 rounds per game
- Teams: 1
- Selected Category: Animals - Easy
- Show Buttons: Off (tilt-only mode)
- Haptic Feedback: On
- Sound: On in Game Mode, Off in Study Mode (auto-toggles when switching modes)

## Saved Between Sessions
- Timer duration and number of rounds
- Which categories you have selected
- Button, haptic, and sound preferences
- Any custom word lists you create
- Changes to built-in lists (edits, soft deletes, permanent deletes)
- Study Mode / Game Mode selection

## Building the App
Open `ios/App/FGPFT.xcodeproj` in Xcode, select your target device, and build. Requires Xcode 15+ and iOS 15.0+.

## Tech Stack
- **Platform**: Native iOS (SwiftUI)
- **Language**: Swift
- **State Management**: Combine with UserDefaults persistence
- **Motion Detection**: CoreMotion for tilt gestures
- **Audio**: AVFoundation for sound effects
- **Minimum iOS**: iOS 15.0+

## Contributing
Fork on GitHub, make changes, and submit a pull request with details on what you fixed or added. Include screenshots of gameplay improvements. Test on multiple devices.

## License
Licensed under the MIT License (LICENSE.txt)

## Credits
- Fonts:
    [Outfit](https://fonts.google.com/specimen/Outfit)
    [Titan One](https://fonts.google.com/specimen/Titan+One) from Google Fonts under [SIL Open Font License](https://scripts.sil.org/OFL)
- Game Concept: Inspired by classic party guessing games like Charades and Heads Up!
- Author: Keith Jasken © 2025. Contributions welcome via pull requests.

## Audio Credits
Sound effects obtained free for personal and commercial use from [FreeSoundEffects.net](https://free-sound-effects.net/).

## Artwork Credits
App icon designed with the assistance of [Perplexity AI](https://perplexity.ai/), based on original concept and direction by Keith Jasken.
