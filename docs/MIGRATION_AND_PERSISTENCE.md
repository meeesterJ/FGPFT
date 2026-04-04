# Migration, persistence, and App Store updates (FGPFT)

This note describes how local data behaves across app updates and what to watch when changing bundled categories or persisted settings.

## Persistence overview

- **Primary store**: A single JSON blob in `UserDefaults` under the key `guess-party-storage`, decoded as `PersistedGameState` in `GameStore.swift`.
- **Built-in categories**: Loaded from bundled `word-lists.json` at launch; user data merges (overrides, deletions, selections, custom lists).
- **Other keys**: e.g. `guess-party-migrated-default-team-names-v1` for a one-off team-name migration.
- **`storageVersion`**: A constant exists in `GameStore.swift` but is **not** read or written in code. There is **no** automatic schema versioning beyond explicit branches in `loadPersisted()` (e.g. per-mode settings when `gameModeSettings` / `studyModeSettings` are nil).

## Decode failure = reset-like behavior

If `JSONDecoder` fails to decode `PersistedGameState`, `loadPersisted()` returns without applying saved data. The user effectively gets **initializer defaults** (similar to a fresh install) for everything in that blob — **silent data loss** for that device.

## Codable / schema changes

- **Extra keys** in JSON: ignored by `JSONDecoder` (usually fine when reading newer-shaped data with an older app — not the common forward-update case).
- **Missing or wrong-type keys** for **non-optional** properties: **whole decode fails** → same as above.

When evolving `PersistedGameState`, `WordList`, `BuiltInListOverride`, or `ModeSettings`:

- Prefer **optional** new fields with nil-safe defaults, or
- Implement an explicit **versioned migration** before tightening types. Consider wiring `storageVersion` (or similar) if you need multi-step migrations.

## Built-in categories (`word-lists.json`)

Stable **`id` strings** are the primary keys. User state references ids in:

- `selectedListIds`
- `favoriteListIds`
- `builtInListOverrides` (keyed by id)
- `deletedBuiltInLists` / `permanentlyDeletedBuiltInLists`

### Removing a category (id no longer in bundle)

- `startGame()` filters `selectedListIds` to ids that still exist among available built-in + custom lists; if none remain, it falls back to **the first available list** and updates `selectedListIds`.
- **Orphan ids** may remain in favorites, overrides, and delete arrays — usually harmless but **dead data** and can confuse UI if not filtered.
- Overrides for removed ids no longer apply to any list.

### Renaming a built-in `id`

Treat as **breaking**: selections, favorites, overrides, and delete flags still point at the **old** id unless you run a **one-time migration** rewriting those structures, or you **never change** ids (only `name` / `words` / `isStudy`).

### Changing only `name` or words in the bundle

- Users **without** overrides see updated bundle content.
- Users **with** `builtInListOverrides[id]` keep overridden `name` / `words` / `isStudy` until they reset that list in the app.

### Changing `isStudy` in the bundle

Effective value is `override.isStudy ?? list.isStudy`; overrides can override the new default until reset.

## Permanent delete vs “bringing a category back”

If a user **permanently deleted** a built-in list, its id stays in `permanentlyDeletedBuiltInLists`. Shipping a new version that re-adds the **same `id`** will still **exclude** that list for those users. Mitigations: use a **new id** for the revived list, or migrate **removing** that id from `permanentlyDeletedBuiltInLists` when intentionally restoring content.

## Settings and code defaults

Persisted values override **code defaults**. Changing default timer, rounds, teams, toggles, etc. in Swift **does not** retroactively change existing installs unless you add migration logic or the user clears data.

**Game round timer:** On load, if the app is in Game mode, `roundDuration` is normalized to the current build’s allowed game steps (`GameRoundTimerOptions`). Values from older builds (e.g. 5s/10s steps or arbitrary seconds from the old continuous slider) snap to the nearest production duration; if the stored value changes, the blob is saved again so the slider stays aligned.

## Custom lists

- Stored in the same JSON blob (`customLists`, `deletedCustomLists`).
- IDs are `custom-<UnixSeconds>` at creation time (collision possible if two lists created in the same second — unlikely).

## Testing and release

- Test **upgrade paths**: install an older build, exercise real usage, then install the new build over it.
- Watch for **decode failures** after struct changes.
- Remember **phased rollout**: old binaries keep old bundled JSON and old code; there is **no** server-side migration — all data is **on-device**.

## Quick reference

| Change | Risk |
|--------|------|
| Remove built-in category | Orphan ids; gameplay usually OK via `startGame()` fallback; cruft in persisted dicts |
| Rename built-in `id` | Broken links unless migrated |
| Add required non-optional persisted field | Decode failure → full blob effectively lost |
| Re-add category with same `id` after permanent delete | Still hidden for users who permanently deleted it |
| Change bundle `name`/words only | Overridden users unchanged until reset |
| Change Swift defaults only | New installs / fresh state only |

**Principle**: Treat built-in **`id` as stable forever**; use optional fields + explicit migration for persisted shape changes; remap or clean ids when removing or renaming categories.
