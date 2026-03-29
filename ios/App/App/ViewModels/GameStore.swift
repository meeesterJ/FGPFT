import Foundation
import Combine
import UIKit

private let storageKey = "guess-party-storage"
private let storageVersion = 9
private let migratedDefaultTeamNamesKey = "guess-party-migrated-default-team-names-v1"

/// Default names for teams 1–5 (matches pink → yellow color order).
private let defaultTeamNameList = ["Flamingos", "Oxen", "Grapes", "Pickles", "Bumblebees"]

func defaultTeamName(at index: Int) -> String {
    if index >= 0, index < defaultTeamNameList.count {
        return defaultTeamNameList[index]
    }
    return "Team \(index + 1)"
}

func defaultTeamNames(count: Int) -> [String] {
    (0..<count).map { defaultTeamName(at: $0) }
}

private func isAllGenericTeamNames(_ names: [String], count: Int) -> Bool {
    guard names.count == count, count >= 1 else { return false }
    for i in 0..<count {
        if names[i] != "Team \(i + 1)" { return false }
    }
    return true
}

/// Per-mode settings (sound, volume, haptic, tilt, buttons). Stored separately for Game and Study so switching modes restores each mode's last-used values.
struct ModeSettings: Codable {
    var soundEnabled: Bool
    var soundVolume: Int
    var hapticEnabled: Bool
    var tiltEnabled: Bool
    var showButtons: Bool

    static func gameDefaults() -> ModeSettings {
        ModeSettings(
            soundEnabled: true,
            soundVolume: 100,
            hapticEnabled: true,
            tiltEnabled: true,
            showButtons: false
        )
    }

    static func studyDefaults() -> ModeSettings {
        ModeSettings(
            soundEnabled: false,
            soundVolume: 100,
            hapticEnabled: false,
            tiltEnabled: false,
            showButtons: true
        )
    }

    /// iPad game defaults: thumb buttons on, tilt off (tilt can be enabled in settings).
    static func gamePadDefaults() -> ModeSettings {
        ModeSettings(
            soundEnabled: true,
            soundVolume: 100,
            hapticEnabled: true,
            tiltEnabled: false,
            showButtons: true
        )
    }

    /// Ensures `tiltEnabled || showButtons`; on iPad, buttons always stay on.
    func sanitized() -> ModeSettings {
        var s = self
        if LayoutAdaptation.isPad {
            s.showButtons = true
        }
        if !s.tiltEnabled && !s.showButtons {
            s.showButtons = true
        }
        return s
    }
}

struct BuiltInListOverride: Codable {
    var name: String?
    var words: [String]?
    var isStudy: Bool?
}

struct PersistedGameState: Codable {
    var studyMode: Bool
    var roundDuration: Int
    var totalRounds: Int
    var showButtons: Bool
    var tiltEnabled: Bool
    var numberOfTeams: Int
    var teamNames: [String]
    var hapticEnabled: Bool
    var soundEnabled: Bool
    var soundVolume: Int
    var tiltPermissionGranted: Bool
    var selectedListIds: [String]
    var customLists: [WordList]
    var builtInListOverrides: [String: BuiltInListOverride]
    var deletedBuiltInLists: [String]
    var permanentlyDeletedBuiltInLists: [String]
    var deletedCustomLists: [WordList]?
    /// New format: per-mode settings. Nil when loading old persisted data (migration).
    var gameModeSettings: ModeSettings?
    var studyModeSettings: ModeSettings?
}

final class GameStore: ObservableObject {
    // MARK: - Persisted settings
    @Published var studyMode: Bool
    @Published var roundDuration: Int
    @Published var totalRounds: Int
    @Published var showButtons: Bool
    @Published var tiltEnabled: Bool
    @Published var numberOfTeams: Int
    @Published var teamNames: [String]
    @Published var hapticEnabled: Bool
    @Published var soundEnabled: Bool
    @Published var soundVolume: Int
    @Published var tiltPermissionGranted: Bool
    @Published var selectedListIds: [String]
    @Published var customLists: [WordList]
    @Published var builtInListOverrides: [String: BuiltInListOverride]
    @Published var deletedBuiltInLists: [String]
    @Published var permanentlyDeletedBuiltInLists: [String]
    @Published var deletedCustomLists: [WordList]
    
    // MARK: - Session state (not persisted)
    @Published var currentRound: Int
    @Published var currentScore: Int
    @Published var currentWord: String?
    @Published var deck: [String]
    @Published var usedWords: [String]
    @Published var isPlaying: Bool
    @Published var isRoundOver: Bool
    @Published var isGameFinished: Bool
    @Published var roundResults: [(word: String, correct: Bool)]
    @Published var currentTeam: Int
    @Published var teamRoundScores: [TeamScore]
    @Published var teamTotalScores: [TeamScore]
    @Published var teamRoundResults: [[(word: String, correct: Bool)]]
    @Published var teamGameResults: [[(word: String, correct: Bool)]]
    @Published var teamScoreHistory: [[TeamScore]]
    
    private let userDefaults: UserDefaults
    private var builtInLists: [WordList] = []
    private var cancellables = Set<AnyCancellable>()
    /// Per-mode slots; initialized to defaults so first install has valid state before any persist.
    private var gameModeSettings: ModeSettings
    private var studyModeSettings: ModeSettings

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        self.studyMode = false
        self.roundDuration = 30
        self.totalRounds = 3
        self.showButtons = false
        self.tiltEnabled = true
        self.numberOfTeams = 1
        self.teamNames = [defaultTeamName(at: 0)]
        self.hapticEnabled = true
        self.soundEnabled = true
        self.soundVolume = 100
        self.tiltPermissionGranted = true
        self.selectedListIds = ["animals-easy"]
        self.customLists = []
        self.builtInListOverrides = [:]
        self.deletedBuiltInLists = []
        self.permanentlyDeletedBuiltInLists = []
        self.deletedCustomLists = []
        self.currentRound = 0
        self.currentScore = 0
        self.currentWord = nil
        self.deck = []
        self.usedWords = []
        self.isPlaying = false
        self.isRoundOver = false
        self.isGameFinished = false
        self.roundResults = []
        self.currentTeam = 1
        self.teamRoundScores = []
        self.teamTotalScores = []
        self.teamRoundResults = []
        self.teamGameResults = []
        self.teamScoreHistory = []
        self.gameModeSettings = LayoutAdaptation.isPad ? ModeSettings.gamePadDefaults() : ModeSettings.gameDefaults()
        self.studyModeSettings = ModeSettings.studyDefaults()
        loadBuiltInLists()
        loadPersisted()
        applyCurrentModeSlotToLive()
        setupPersistence()
    }
    
    private func loadBuiltInLists() {
        guard let url = Bundle.main.url(forResource: "word-lists", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([WordListCodable].self, from: data) else {
            builtInLists = []
            return
        }
        builtInLists = decoded.map { WordList(id: $0.id, name: $0.name, words: $0.words, isCustom: false, isStudy: $0.isStudy) }
    }
    
    private struct WordListCodable: Codable {
        let id: String
        let name: String
        let words: [String]
        let isStudy: Bool?
    }
    
    private func loadPersisted() {
        guard let data = userDefaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode(PersistedGameState.self, from: data) else { return }
        studyMode = decoded.studyMode
        roundDuration = decoded.roundDuration
        totalRounds = decoded.totalRounds
        numberOfTeams = decoded.numberOfTeams
        teamNames = decoded.teamNames.isEmpty ? defaultTeamNames(count: numberOfTeams) : decoded.teamNames
        if !userDefaults.bool(forKey: migratedDefaultTeamNamesKey),
           isAllGenericTeamNames(teamNames, count: numberOfTeams) {
            teamNames = defaultTeamNames(count: numberOfTeams)
            userDefaults.set(true, forKey: migratedDefaultTeamNamesKey)
        }
        tiltPermissionGranted = decoded.tiltPermissionGranted
        selectedListIds = decoded.selectedListIds
        customLists = decoded.customLists
        builtInListOverrides = decoded.builtInListOverrides
        deletedBuiltInLists = decoded.deletedBuiltInLists
        permanentlyDeletedBuiltInLists = decoded.permanentlyDeletedBuiltInLists
        deletedCustomLists = decoded.deletedCustomLists ?? []

        if let game = decoded.gameModeSettings, let study = decoded.studyModeSettings {
            gameModeSettings = game
            studyModeSettings = study
        } else {
            // Migration: old format had only single settings. Current mode's slot = decoded values (sanitized); other = defaults.
            if decoded.studyMode {
                studyModeSettings = ModeSettings(
                    soundEnabled: decoded.soundEnabled,
                    soundVolume: decoded.soundVolume,
                    hapticEnabled: decoded.hapticEnabled,
                    tiltEnabled: decoded.tiltEnabled,
                    showButtons: decoded.showButtons
                ).sanitized()
                gameModeSettings = LayoutAdaptation.isPad ? ModeSettings.gamePadDefaults() : ModeSettings.gameDefaults()
            } else {
                gameModeSettings = ModeSettings(
                    soundEnabled: decoded.soundEnabled,
                    soundVolume: decoded.soundVolume,
                    hapticEnabled: decoded.hapticEnabled,
                    tiltEnabled: decoded.tiltEnabled,
                    showButtons: decoded.showButtons
                ).sanitized()
                studyModeSettings = ModeSettings.studyDefaults()
            }
            savePersisted()
        }
    }

    /// Copies the active mode's slot (game or study) into the live @Published settings. Sanitizes so buttons are on when tilt is off, and writes back so we never persist invalid state.
    private func applyCurrentModeSlotToLive() {
        let slot = (studyMode ? studyModeSettings : gameModeSettings).sanitized()
        if studyMode {
            studyModeSettings = slot
        } else {
            gameModeSettings = slot
        }
        soundEnabled = slot.soundEnabled
        soundVolume = slot.soundVolume
        hapticEnabled = slot.hapticEnabled
        tiltEnabled = slot.tiltEnabled
        showButtons = slot.showButtons
    }

    /// Writes current live settings into the active mode's slot so they persist when switching away and back.
    private func updateCurrentModeSlot() {
        let slot = ModeSettings(
            soundEnabled: soundEnabled,
            soundVolume: soundVolume,
            hapticEnabled: hapticEnabled,
            tiltEnabled: tiltEnabled,
            showButtons: showButtons
        )
        if studyMode {
            studyModeSettings = slot
        } else {
            gameModeSettings = slot
        }
    }
    
    private func setupPersistence() {
        objectWillChange
            .debounce(for: .milliseconds(150), scheduler: RunLoop.main)
            .sink { [weak self] _ in self?.savePersisted() }
            .store(in: &cancellables)
    }
    
    private func savePersisted() {
        let state = PersistedGameState(
            studyMode: studyMode,
            roundDuration: roundDuration,
            totalRounds: totalRounds,
            showButtons: showButtons,
            tiltEnabled: tiltEnabled,
            numberOfTeams: numberOfTeams,
            teamNames: teamNames,
            hapticEnabled: hapticEnabled,
            soundEnabled: soundEnabled,
            soundVolume: soundVolume,
            tiltPermissionGranted: tiltPermissionGranted,
            selectedListIds: selectedListIds,
            customLists: customLists,
            builtInListOverrides: builtInListOverrides,
            deletedBuiltInLists: deletedBuiltInLists,
            permanentlyDeletedBuiltInLists: permanentlyDeletedBuiltInLists,
            deletedCustomLists: deletedCustomLists,
            gameModeSettings: gameModeSettings,
            studyModeSettings: studyModeSettings
        )
        if let data = try? JSONEncoder().encode(state) {
            userDefaults.set(data, forKey: storageKey)
        }
    }
    
    // MARK: - Effective lists
    
    /// Returns built-in lists that are soft-deleted (can be restored or permanently deleted).
    func getDeletedBuiltInLists() -> [WordList] {
        builtInLists.filter {
            deletedBuiltInLists.contains($0.id) && !permanentlyDeletedBuiltInLists.contains($0.id)
        }
    }
    
    func getEffectiveBuiltInLists() -> [WordList] {
        builtInLists.map { list in
            guard let override = builtInListOverrides[list.id] else { return list }
            return WordList(
                id: list.id,
                name: override.name ?? list.name,
                words: override.words ?? list.words,
                isCustom: false,
                isStudy: override.isStudy ?? list.isStudy
            )
        }
    }
    
    func getTeamName(teamNumber: Int) -> String {
        let index = teamNumber - 1
        guard index >= 0, index < teamNames.count else { return defaultTeamName(at: index) }
        return teamNames[index].isEmpty ? defaultTeamName(at: index) : teamNames[index]
    }
    
    func getTeamColor(teamNumber: Int) -> TeamThemeColor {
        TeamThemeColor.forTeam(teamNumber)
    }
    
    // MARK: - Settings actions
    
    func setStudyMode(_ enabled: Bool) {
        // Save current live settings into the current mode's slot before switching.
        let currentSlot = ModeSettings(
            soundEnabled: soundEnabled,
            soundVolume: soundVolume,
            hapticEnabled: hapticEnabled,
            tiltEnabled: tiltEnabled,
            showButtons: showButtons
        )
        if studyMode {
            studyModeSettings = currentSlot
        } else {
            gameModeSettings = currentSlot
        }
        studyMode = enabled
        applyCurrentModeSlotToLive()
    }
    
    func setRoundDuration(_ seconds: Int) { roundDuration = seconds }
    func setTotalRounds(_ rounds: Int) { totalRounds = rounds }
    func setShowButtons(_ show: Bool) {
        if LayoutAdaptation.isPad, !show { return }
        if !show, !tiltEnabled {
            tiltEnabled = true
        }
        showButtons = show
        updateCurrentModeSlot()
    }

    func setTiltEnabled(_ enabled: Bool) {
        if !enabled, !showButtons {
            showButtons = true
        }
        tiltEnabled = enabled
        updateCurrentModeSlot()
    }

    func setHapticEnabled(_ enabled: Bool) {
        hapticEnabled = enabled
        updateCurrentModeSlot()
    }
    func setSoundEnabled(_ enabled: Bool) {
        soundEnabled = enabled
        updateCurrentModeSlot()
    }
    func setSoundVolume(_ volume: Int) {
        soundVolume = min(100, max(0, volume))
        updateCurrentModeSlot()
    }
    func setTiltPermissionGranted(_ granted: Bool) { tiltPermissionGranted = granted }
    
    /// Toggles list selection. Empty selectedListIds is allowed; startGame() uses a fallback (e.g. first available list) when starting.
    func toggleListSelection(id: String) {
        if selectedListIds.contains(id) {
            selectedListIds.removeAll { $0 == id }
        } else {
            selectedListIds.append(id)
        }
    }
    
    func clearListSelections() {
        selectedListIds = []
    }
    
    func setSelectedListIds(_ ids: [String]) {
        selectedListIds = ids
    }
    
    /// Adds a custom list and selects only it (replaces current selection). Intentional iOS behavior; fallback in startGame() handles empty selection if needed.
    func addCustomList(_ list: WordList) {
        var list = list
        list.isCustom = true
        customLists.append(list)
        selectedListIds = [list.id]
    }
    
    func removeCustomList(id: String) {
        guard let listToDelete = customLists.first(where: { $0.id == id }) else { return }
        customLists.removeAll { $0.id == id }
        selectedListIds.removeAll { $0 == id }
        deletedCustomLists.append(listToDelete)
    }
    
    func restoreCustomList(id: String) {
        guard let listToRestore = deletedCustomLists.first(where: { $0.id == id }) else { return }
        deletedCustomLists.removeAll { $0.id == id }
        customLists.append(listToRestore)
    }
    
    func permanentlyDeleteCustomList(id: String) {
        deletedCustomLists.removeAll { $0.id == id }
    }
    
    func getDeletedCustomLists() -> [WordList] {
        deletedCustomLists
    }
    
    func updateCustomList(id: String, updatedList: WordList) {
        guard let idx = customLists.firstIndex(where: { $0.id == id }) else { return }
        customLists[idx] = updatedList
    }
    
    func updateBuiltInList(id: String, name: String, words: [String], isStudy: Bool? = nil) {
        builtInListOverrides[id] = BuiltInListOverride(name: name, words: words, isStudy: isStudy)
    }
    
    func resetBuiltInList(id: String) {
        builtInListOverrides.removeValue(forKey: id)
    }
    
    func deleteBuiltInList(id: String) {
        deletedBuiltInLists.append(id)
        selectedListIds.removeAll { $0 == id }
    }
    
    func restoreBuiltInList(id: String) {
        deletedBuiltInLists.removeAll { $0 == id }
    }
    
    func permanentlyDeleteBuiltInList(id: String) {
        deletedBuiltInLists.removeAll { $0 == id }
        permanentlyDeletedBuiltInLists.append(id)
    }
    
    func setNumberOfTeams(_ count: Int) {
        numberOfTeams = count
        while teamNames.count < count {
            teamNames.append(defaultTeamName(at: teamNames.count))
        }
        if teamNames.count > count {
            teamNames = Array(teamNames.prefix(count))
        }
    }
    
    func setTeamName(index: Int, name: String) {
        let trimmed = String(name.prefix(MAX_TEAM_NAME_LENGTH))
        if index >= 0 && index < teamNames.count {
            teamNames[index] = trimmed
        }
    }
    
    // MARK: - Game actions
    
    func startGame() {
        let effective = getEffectiveBuiltInLists()
        let available = effective.filter { !deletedBuiltInLists.contains($0.id) && !permanentlyDeletedBuiltInLists.contains($0.id) } + customLists
        var activeIds = selectedListIds.filter { id in available.contains(where: { $0.id == id }) }
        if activeIds.isEmpty, let first = available.first {
            activeIds = [first.id]
            selectedListIds = activeIds
        }
        let activeLists = available.filter { activeIds.contains($0.id) }
        let allWords = Array(Set(activeLists.flatMap(\.words))).shuffled()
        let emptyScores = (0..<numberOfTeams).map { _ in TeamScore() }
        let emptyResults = (0..<numberOfTeams).map { _ in [(word: String, correct: Bool)]() }
        currentRound = 0
        deck = allWords
        usedWords = []
        isGameFinished = false
        isRoundOver = true
        isPlaying = false
        currentTeam = 0
        teamRoundScores = emptyScores
        teamTotalScores = emptyScores
        teamRoundResults = emptyResults
        teamGameResults = emptyResults
        teamScoreHistory = []
        prepareRound()
    }
    
    func prepareRound() {
        let allTeamsPlayed = currentTeam >= numberOfTeams
        if !allTeamsPlayed && currentTeam > 0 {
            currentTeam += 1
            currentScore = 0
            roundResults = []
            currentWord = deck.first ?? "No Words!"
            isPlaying = false
            isRoundOver = false
            return
        }
        if allTeamsPlayed && currentRound >= totalRounds {
            isGameFinished = true
            isPlaying = false
            return
        }
        currentRound += 1
        currentTeam = 1
        currentScore = 0
        roundResults = []
        teamRoundScores = (0..<numberOfTeams).map { _ in TeamScore() }
        teamRoundResults = (0..<numberOfTeams).map { _ in [(word: String, correct: Bool)]() }
        teamScoreHistory.append(Array(repeating: TeamScore(), count: numberOfTeams))
        currentWord = deck.first ?? "No Words!"
        isPlaying = false
        isRoundOver = false
    }
    
    func beginRound() {
        isPlaying = true
    }
    
    func nextWord(correct: Bool) {
        guard let word = currentWord, word != "No Words!" else { return }
        let entry = (word: word, correct: correct)
        let newResults = roundResults + [entry]
        let newScore = correct ? currentScore + 1 : currentScore
        let newUsed = usedWords + [word]
        let newDeck = Array(deck.dropFirst())
        var nextWordStr = newDeck.first
        var finalDeck = newDeck
        var finalUsed = newUsed
        
        if newDeck.isEmpty {
            if roundDuration == 0 || studyMode {
                let teamIndex = currentTeam - 1
                if teamIndex >= 0 && teamIndex < teamRoundResults.count {
                    teamRoundResults[teamIndex].append(entry)
                }
                currentScore = newScore
                roundResults = newResults
                deck = []
                usedWords = finalUsed
                currentWord = nil
                endRound()
                return
            }
            let reshuffled = newUsed.shuffled()
            nextWordStr = reshuffled.first
            finalDeck = reshuffled
            finalUsed = []
        }
        
        let teamIndex = currentTeam - 1
        if teamIndex >= 0 && teamIndex < teamRoundResults.count {
            teamRoundResults[teamIndex].append(entry)
        }
        currentScore = newScore
        roundResults = newResults
        deck = finalDeck
        usedWords = finalUsed
        currentWord = nextWordStr
    }
    
    func endRound() {
        // Treat "seen but unanswered" word as used so the next team does not see it
        if let w = currentWord, w != "No Words!", !deck.isEmpty, deck.first == w {
            deck = Array(deck.dropFirst())
            usedWords = usedWords + [w]
        }
        let correctCount = roundResults.filter(\.correct).count
        let passedCount = roundResults.filter { !$0.correct }.count
        let teamIndex = currentTeam - 1
        if teamIndex >= 0 && teamIndex < teamRoundScores.count {
            teamRoundScores[teamIndex] = TeamScore(correct: correctCount, passed: passedCount)
        }
        if teamIndex >= 0 && teamIndex < teamTotalScores.count {
            let prev = teamTotalScores[teamIndex]
            teamTotalScores[teamIndex] = TeamScore(correct: prev.correct + correctCount, passed: prev.passed + passedCount)
        }
        if teamIndex >= 0 && teamIndex < teamGameResults.count {
            teamGameResults[teamIndex].append(contentsOf: roundResults)
        }
        let roundIndex = currentRound - 1
        if roundIndex >= 0 && roundIndex < teamScoreHistory.count && teamIndex >= 0 && teamIndex < numberOfTeams {
            teamScoreHistory[roundIndex][teamIndex] = TeamScore(correct: correctCount, passed: passedCount)
        }
        isPlaying = false
        isRoundOver = false
    }
    
    func isAllTeamsPlayed() -> Bool {
        currentTeam >= numberOfTeams
    }
    
    var willGameBeFinished: Bool {
        currentTeam >= numberOfTeams && currentRound >= totalRounds
    }
    
    func resetGame() {
        currentRound = 0
        currentScore = 0
        deck = []
        usedWords = []
        isPlaying = false
        isRoundOver = false
        isGameFinished = false
        currentTeam = 1
        teamRoundScores = []
        teamTotalScores = []
        teamRoundResults = []
        teamGameResults = []
        teamScoreHistory = []
    }
}

