import Foundation

/// Game mode round lengths (seconds). Study mode uses separate steps in `SettingsView`.
enum GameRoundTimerOptions {
    static let productionSteps: [Int] = [15, 30, 45, 60, 75, 90, 120]

    #if DEBUG
    static let gameSteps: [Int] = [5, 10] + productionSteps
    #else
    static let gameSteps: [Int] = productionSteps
    #endif

    static let defaultSeconds = 60

    /// Maps persisted seconds to a valid game-mode step for this build. Unknown values snap to the nearest **production** step; non-positive values become `defaultSeconds`.
    static func sanitizedGameDuration(_ persisted: Int) -> Int {
        if gameSteps.contains(persisted) { return persisted }
        if persisted <= 0 { return defaultSeconds }
        var best = defaultSeconds
        var bestDist = Int.max
        for s in productionSteps {
            let d = abs(s - persisted)
            if d < bestDist {
                bestDist = d
                best = s
            }
        }
        return best
    }
}
