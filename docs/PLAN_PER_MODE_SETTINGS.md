# Per-mode settings and tilt/button coverage

## First-install defaults

When a person first installs the game (no persisted state), these are the settings for each mode. The app starts in **Game mode**; the **Study mode** values are used the first time the user switches to Study mode (and when we create the study slot during migration).

| Setting    | Game mode (first install) | Study mode (first time) |
|------------|----------------------------|--------------------------|
| Sound      | On                         | Off                      |
| Volume     | 100%                       | 100%                     |
| Vibration  | On                         | Off                      |
| Tilt       | On                         | Off                      |
| Buttons    | Off                        | On                       |

Use these same values when defining `ModeSettings` defaults and when migrating existing users who have no per-mode data yet.

---

## 1. Approach: per-mode stored state

Instead of applying fixed defaults when switching modes, persist **two slots** of settings and **restore** the appropriate slot when the user switches mode. That way:

- In **Game mode**, the user can turn sound down, enable buttons, etc.; those choices are saved for Game mode.
- In **Study mode**, they can leave sound off and buttons on; those are saved for Study mode.
- Switching back to Game restores their last Game-mode choices (e.g. sound on at 60%, tilt on, etc.).

Settings to store per mode (the ones that differ by mode in your requirements):

- `soundEnabled`, `soundVolume`, `hapticEnabled`, `tiltEnabled`, `showButtons`

`roundDuration` and `totalRounds` (and team count) are already mode-specific in the UI; you can either keep them global (current behavior) or add them to the per-mode struct later if you want them to be remembered per mode too. The plan below only adds per-mode storage for the five settings above.

---

## 2. Data model and persistence

**New struct** (e.g. in [GameStore.swift](ios/App/App/ViewModels/GameStore.swift)):

```swift
struct ModeSettings: Codable {
    var soundEnabled: Bool
    var soundVolume: Int
    var hapticEnabled: Bool
    var tiltEnabled: Bool
    var showButtons: Bool
}
```

**Persisted state:** Add to `PersistedGameState`:

- `gameModeSettings: ModeSettings?` (optional for backward compatibility)
- `studyModeSettings: ModeSettings?` (optional for backward compatibility)

When decoding, if either is `nil`, treat as "old format" and run migration (see §3). Keep the existing single `soundEnabled`, `soundVolume`, `hapticEnabled`, `tiltEnabled`, `showButtons` in `PersistedGameState` for migration only; after migration you can stop writing them and rely on the two slots. The single source of truth for "what's on screen" is the live `@Published` vars, filled from the active mode's slot.

**Live state:** Keep the existing `@Published` vars (`soundEnabled`, `soundVolume`, `hapticEnabled`, `tiltEnabled`, `showButtons`) as the single set the UI binds to. The store also holds `gameModeSettings` and `studyModeSettings` (either persisted only, or as private vars updated on load and on mode switch).

---

## 3. Migration (first run with new code)

- If decoded `gameModeSettings` or `studyModeSettings` is `nil` (old format), derive both slots:
  - **Current mode's slot**: use decoded `soundEnabled`, `soundVolume`, `hapticEnabled`, `tiltEnabled`, `showButtons`.
  - **Other mode's slot**: use the **First-install defaults** for that mode (see table above). Game defaults: sound on, volume 100%, haptic on, tilt on, buttons off. Study defaults: sound off, volume 100%, haptic off, tilt off, buttons on.
- Assign the two slots in memory and apply the current mode's slot to the live vars. Bump `storageVersion` and persist so the next launch has the new format.

---

## 4. When to read/write each slot

- **On load:** Restore `studyMode` and the two mode slots. Set the live `@Published` settings from the slot for the current mode (e.g. if `studyMode` then from `studyModeSettings`, else from `gameModeSettings`).
- **On mode switch** (`setStudyMode`):
  1. Write current live settings into the **current** mode's slot (game or study).
  2. Load the **other** mode's slot into the live vars.
  3. Set `studyMode = enabled`.
  So switching to Study loads Study's last-used settings; switching to Game loads Game's last-used settings.
- **When the user changes a setting** (e.g. `setSoundEnabled`, `setSoundVolume`, `setHapticEnabled`, `setTiltEnabled`, `setShowButtons`):
  1. Update the live `@Published` var.
  2. Update the **current** mode's slot (so the next time we switch away and back we restore this value).
  Persistence can stay debounced as it is today; you just include the two mode structs in what you save.

---

## 5. GameStore changes (summary)

- Add `ModeSettings` and default helpers (e.g. `static func gameDefaults` / `studyDefaults` using the **First-install defaults** table). Hold `gameModeSettings` and `studyModeSettings` in the store (e.g. private vars), initialized in `init` to the default structs so first install has valid slots before any persist.
- Add optional `gameModeSettings` and `studyModeSettings` to `PersistedGameState`; in `loadPersisted` run migration when nil, then apply the current mode's slot to the live vars.
- In `savePersisted`, include the two mode structs (and stop persisting the old single sound/haptic/tilt/showButtons if you remove them from the persisted model after migration).
- `setStudyMode`: save current live settings to current mode's slot, load the other mode's slot into live vars, set `studyMode`.
- In `setSoundEnabled`, `setSoundVolume`, `setHapticEnabled`, `setTiltEnabled`, `setShowButtons`: after updating the live var, update the current mode's slot (e.g. `if studyMode { studyModeSettings.soundEnabled = ... } else { gameModeSettings.soundEnabled = ... }`), then trigger save as you do today.

No change to the public "shape" of the store from the UI's perspective: the same bindings to `store.soundEnabled`, etc., still work.

---

## 6. SettingsView

- **handleModeToggle:** Keep the existing **teams, totalRounds, and round duration** logic (study: set 1 team, 1 round, study timer steps; game: round duration adjustment). Call `store.setStudyMode(study)` so the store saves the current slot and loads the other mode's slot into the live vars (sound, volume, haptic, tilt, buttons). Remove the explicit `store.setTiltEnabled(true)` in the game branch; that comes from restoring the game slot.

---

## 7. Tilt off and button coverage (unchanged)

- **Tilt off:** [GameView](ios/App/App/Views/GameView.swift) only starts tilt detection in `startGameplayTiltDetection()` behind `guard store.tiltEnabled && !store.studyMode`. So when tilt is off, the game does not respond to tilt anywhere. No change needed.
- **Buttons:** Pass/Correct and Start are already shown when `store.showButtons || !store.tiltEnabled`, so there is full coverage on Ready and Playing. No new screens or buttons required.

---

## 8. Summary

- Add `ModeSettings` and persist `gameModeSettings` and `studyModeSettings`, with defaults matching the **First-install defaults** table.
- Migrate old single settings into the two slots; apply current mode's slot to live vars on load.
- On mode switch: save current live settings to current mode's slot, load other mode's slot into live vars.
- On each setting change: update live var and update current mode's slot.
- SettingsView only calls `setStudyMode(study)` when the user toggles mode; the store handles restoring the right slot.
- Tilt/button behavior and coverage stay as they are.
