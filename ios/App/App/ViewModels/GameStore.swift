import Foundation
import Combine

private let storageKey = "guess-party-storage"
private let storageVersion = 7

func defaultTeamNames(count: Int) -> [String] {
    (1...count).map { "Team \($0)" }
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
    
    private let userDefaults: UserDefaults
    private var builtInLists: [WordList] = []
    private var cancellables = Set<AnyCancellable>()
    
    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        self.studyMode = false
        self.roundDuration = 30
        self.totalRounds = 3
        self.showButtons = false
        self.tiltEnabled = true
        self.numberOfTeams = 1
        self.teamNames = defaultTeamNames(count: 1)
        self.hapticEnabled = true
        self.soundEnabled = true
        self.soundVolume = 100
        self.tiltPermissionGranted = true
        self.selectedListIds = ["animals-easy"]
        self.customLists = []
        self.builtInListOverrides = [:]
        self.deletedBuiltInLists = []
        self.permanentlyDeletedBuiltInLists = []
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
        loadBuiltInLists()
        loadPersisted()
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
        showButtons = decoded.showButtons
        tiltEnabled = decoded.tiltEnabled
        numberOfTeams = decoded.numberOfTeams
        teamNames = decoded.teamNames.isEmpty ? defaultTeamNames(count: numberOfTeams) : decoded.teamNames
        hapticEnabled = decoded.hapticEnabled
        soundEnabled = decoded.soundEnabled
        soundVolume = decoded.soundVolume
        tiltPermissionGranted = decoded.tiltPermissionGranted
        selectedListIds = decoded.selectedListIds
        customLists = decoded.customLists
        builtInListOverrides = decoded.builtInListOverrides
        deletedBuiltInLists = decoded.deletedBuiltInLists
        permanentlyDeletedBuiltInLists = decoded.permanentlyDeletedBuiltInLists
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
            permanentlyDeletedBuiltInLists: permanentlyDeletedBuiltInLists
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
        guard index >= 0, index < teamNames.count else { return "Team \(teamNumber)" }
        return teamNames[index].isEmpty ? "Team \(teamNumber)" : teamNames[index]
    }
    
    func getTeamColor(teamNumber: Int) -> TeamThemeColor {
        TeamThemeColor.forTeam(teamNumber)
    }
    
    // MARK: - Settings actions
    
    func setStudyMode(_ enabled: Bool) {
        studyMode = enabled
        soundEnabled = !enabled
    }
    
    func setRoundDuration(_ seconds: Int) { roundDuration = seconds }
    func setTotalRounds(_ rounds: Int) { totalRounds = rounds }
    func setShowButtons(_ show: Bool) {
        if !tiltEnabled && !show { return }
        showButtons = show
    }
    
    func setTiltEnabled(_ enabled: Bool) {
        tiltEnabled = enabled
        showButtons = !enabled
    }
    
    func setHapticEnabled(_ enabled: Bool) { hapticEnabled = enabled }
    func setSoundEnabled(_ enabled: Bool) { soundEnabled = enabled }
    func setSoundVolume(_ volume: Int) { soundVolume = min(100, max(0, volume)) }
    func setTiltPermissionGranted(_ granted: Bool) { tiltPermissionGranted = granted }
    
    func toggleListSelection(id: String) {
        if selectedListIds.contains(id) {
            if selectedListIds.count <= 1 { return }
            selectedListIds.removeAll { $0 == id }
        } else {
            selectedListIds.append(id)
        }
    }
    
    func addCustomList(_ list: WordList) {
        var list = list
        list.isCustom = true
        customLists.append(list)
        if !selectedListIds.contains(list.id) {
            selectedListIds.append(list.id)
        }
    }
    
    func removeCustomList(id: String) {
        customLists.removeAll { $0.id == id }
        selectedListIds.removeAll { $0 == id }
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
            teamNames.append("Team \(teamNames.count + 1)")
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
        let allWords = activeLists.flatMap(\.words).shuffled()
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
        var newDeck = Array(deck.dropFirst())
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
        isPlaying = false
        isRoundOver = false
    }
    
    func isAllTeamsPlayed() -> Bool {
        currentTeam >= numberOfTeams
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
    }
}

