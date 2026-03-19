import SwiftUI

struct GameView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    @StateObject private var motion = MotionService()
    
    @State private var isWaitingForReady = true
    @State private var isCountingDown = false
    @State private var countdownSec = 3
    @State private var isHandoff = false
    @State private var timeLeft: Int = 30
    @State private var timerTask: Task<Void, Never>?
    @State private var answerRevealed = false
    @State private var lastAnswerCorrect: Bool? = nil
    @State private var showAnswerFeedback = false
    
    private var volume: Float { Float(store.soundVolume) / 100 }
    
    /// The ready-screen "Start" button is redundant on round 1 because the screen is tappable to advance.
    private var shouldShowStartButton: Bool {
        (store.showButtons || !store.tiltEnabled) && store.currentRound > 1
    }
    
    private var multicoloredRound: some View {
        MulticoloredRoundText(fontSize: 56)
    }
    
    private var multicoloredStudy: some View {
        MulticoloredStudyText(fontSize: 120)
    }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            if store.currentWord == nil && !isHandoff {
                VStack(spacing: 14) {
                    ProgressView()
                        .tint(.white)
                    Text("Loading…")
                        .font(AppFonts.body(size: 16))
                        .foregroundStyle(.white)
                }
            } else {
                mainGameContent
            }
            
            HomeButtonOverlay {
                timerTask?.cancel()
                motion.stopMonitoring()
                store.resetGame()
                path = NavigationPath()
            }
        }
        .ignoresSafeArea()
        .navigationBarHidden(true)
        .onAppear {
            OrientationManager.shared.supportedOrientations = .landscapeLeft
            OrientationManager.shared.requestLandscapeIfNeeded()
            onAppear()
        }
        .onChange(of: store.isGameFinished) { _ in if store.isGameFinished && !store.studyMode { path.append(AppRoute.summary) } }
    }
    
    private var mainGameContent: some View {
        ZStack {
            if isHandoff {
                handoffOverlay
            } else if isWaitingForReady {
                readyOverlay
            } else if isCountingDown {
                countdownOverlay
            } else {
                playingView
            }
        }
    }
    
    private var readyOverlay: some View {
        Group {
            if store.numberOfTeams > 1 {
                multiTeamReadyLayout
            } else {
                singleTeamReadyLayout
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            triggerCountdown()
        }
    }
    
    private var multiTeamReadyLayout: some View {
        HStack(spacing: 0) {
            VStack(alignment: .center, spacing: 28) {
                Spacer()
                Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                    .font(AppFonts.display(size: 44))
                    .foregroundStyle(teamColor(store.currentTeam))
                
                if shouldShowStartButton {
                    Button {
                        triggerCountdown()
                    } label: {
                        Label("Start", systemImage: "play.fill")
                            .font(AppFonts.body(size: 22))
                            .padding(.horizontal, 32)
                            .padding(.vertical, 16)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(teamColor(store.currentTeam))
                }
                Spacer()
            }
            .frame(maxWidth: .infinity)
            
            VStack {
                Spacer()
                if store.studyMode {
                    multicoloredStudy
                } else {
                    multicoloredRound
                    Text("\(store.currentRound)")
                        .font(AppFonts.display(size: 180))
                        .foregroundStyle(AppColors.yellow)
                }
                Spacer()
                if !store.studyMode {
                    VStack(spacing: 4) {
                        Text("Raise phone to forehead.")
                        Text("Tap screen when ready.")
                    }
                    .font(AppFonts.body(size: 20))
                    .foregroundStyle(AppColors.mutedText)
                }
                Spacer()
                    .frame(height: 60)
            }
            .frame(maxWidth: .infinity)
        }
    }
    
    private var singleTeamReadyLayout: some View {
        VStack {
            Spacer()
            if store.studyMode {
                multicoloredStudy
            } else {
                multicoloredRound
                Text("\(store.currentRound)")
                    .font(AppFonts.display(size: 180))
                    .foregroundStyle(AppColors.yellow)
            }
            Spacer()
            if store.studyMode {
                HStack(spacing: 8) {
                    Image(systemName: "iphone")
                        .font(AppFonts.sfSymbol(size: 18))
                    Text("Tap anywhere to start")
                }
                .font(AppFonts.body(size: 20))
                .foregroundStyle(AppColors.mutedText)
            } else {
                VStack(spacing: 4) {
                    Text("Raise phone to forehead.")
                    Text("Tap screen when ready.")
                }
                .font(AppFonts.body(size: 20))
                .foregroundStyle(AppColors.mutedText)
                
                if shouldShowStartButton {
                    Button {
                        triggerCountdown()
                    } label: {
                        Label("Start", systemImage: "play.fill")
                            .font(AppFonts.body(size: 22))
                            .padding(.horizontal, 32)
                            .padding(.vertical, 16)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppColors.pink)
                    .padding(.top, 8)
                }
            }
            Spacer()
                .frame(height: 60)
        }
    }
    
    private var countdownOverlay: some View {
        Text(countdownSec > 0 ? "\(countdownSec)" : "Go!")
            .font(AppFonts.display(size: 120))
            .foregroundStyle(AppColors.yellow)
    }
    
    private var playingView: some View {
        HStack(spacing: 0) {
            // Fixed three-slot layout: timer above, score centered, answer icon below.
            // Slots always reserve space so the score does not shift when the icon appears.
            VStack(spacing: 4) {
                Group {
                    if store.roundDuration > 0 && store.isPlaying {
                        Text("\(timeLeft)s")
                            .font(AppFonts.body(size: 48).monospacedDigit())
                            .foregroundStyle(timeLeft <= 5 ? AppColors.pink : AppColors.green)
                    } else {
                        Color.clear
                    }
                }
                .frame(height: 52)
                
                Text("\(store.currentScore)")
                    .font(AppFonts.body(size: 40))
                    .foregroundStyle(AppColors.yellow)
                
                ZStack {
                    Color.clear
                        .frame(width: 36, height: 36)
                    Image(systemName: (lastAnswerCorrect ?? false) ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(AppFonts.sfSymbol(size: 36))
                        .foregroundStyle((lastAnswerCorrect ?? false) ? AppColors.green : AppColors.pink)
                        .opacity(showAnswerFeedback ? 1 : 0)
                }
                .frame(width: 36, height: 36)
            }
            .frame(width: 80)
            .padding(.leading, 16)
            .animation(.easeInOut(duration: 0.2), value: showAnswerFeedback)
            
            if let word = store.currentWord, word != "No Words!" {
                wordDisplayView(for: word)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.horizontal, 16)
            } else {
                Spacer()
            }
            
            if store.showButtons || !store.tiltEnabled {
                VStack {
                    Button {
                        handlePass()
                    } label: {
                        Label("Pass", systemImage: "xmark")
                            .font(AppFonts.body(size: 22))
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    .padding(.top, 16)
                    
                    Spacer()
                    
                    Button {
                        handleCorrect()
                    } label: {
                        Label("Correct", systemImage: "checkmark")
                            .font(AppFonts.body(size: 22))
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .padding(.bottom, 16)
                }
                .padding(.trailing, 24)
            } else {
                Color.clear.frame(width: 24)
            }
        }
    }
    
    private var handoffOverlay: some View {
        VStack(spacing: 32) {
            Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                .font(AppFonts.display(size: 44))
                .foregroundStyle(teamColor(store.currentTeam))
                .multilineTextAlignment(.center)
            Button {
                isHandoff = false
                isWaitingForReady = true
            } label: {
                Text("Ready!")
                    .font(AppFonts.body(size: 24))
                    .padding(.horizontal, 48)
                    .padding(.vertical, 20)
            }
            .buttonStyle(.borderedProminent)
            .tint(AppColors.cyan)
        }
    }
    
    private func onAppear() {
        if store.deck.isEmpty {
            store.startGame()
        } else if store.currentWord == nil {
            store.prepareRound()
        }
        isWaitingForReady = true
        isHandoff = store.numberOfTeams > 1 && store.currentTeam > 1
        timeLeft = store.roundDuration == 0 ? 0 : min(store.roundDuration, 599)
    }
    
    private func triggerCountdown() {
        motion.stopMonitoring()
        isWaitingForReady = false
        isCountingDown = true
        countdownSec = 3
        if store.soundEnabled {
            AudioService.shared.play("countdown", volume: volume)
        }
        Task { @MainActor in
            for s in [3, 2, 1] {
                countdownSec = s
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            countdownSec = 0
            try? await Task.sleep(nanoseconds: 400_000_000)
            isCountingDown = false
            store.beginRound()
            startTimer()
            startGameplayTiltDetection()
        }
    }
    
    private func startGameplayTiltDetection() {
        guard store.tiltEnabled && !store.studyMode else { return }
        motion.startMonitoringForReady()
        motion.startTiltDetection(
            onForward: { [self] in DispatchQueue.main.async { handleCorrect() } },
            onBack: { [self] in DispatchQueue.main.async { handlePass() } }
        )
    }
    
    private func startTimer() {
        timerTask?.cancel()
        guard store.roundDuration > 0 else { return }
        timeLeft = store.roundDuration
        timerTask = Task { @MainActor in
            while timeLeft > 0 && !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { break }
                timeLeft -= 1
                if timeLeft <= 5 && timeLeft > 0, store.soundEnabled {
                    AudioService.shared.play(timeLeft % 2 == 1 ? "tick" : "tock", volume: volume)
                }
                if timeLeft == 0 {
                    if store.soundEnabled { AudioService.shared.play("roundEnd", volume: volume) }
                    store.endRound()
                    showTeamScoreOrNext()
                    return
                }
            }
        }
    }
    
    private func showTeamScoreOrNext() {
        timerTask?.cancel()
        motion.stopTiltDetection()
        motion.stopMonitoring()
        path.append(AppRoute.roundSummary)
    }
    
    private func handleCorrect() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.correct() }
        if store.soundEnabled { AudioService.shared.play("correct", volume: volume) }
        answerRevealed = false
        showFeedback(correct: true)
        store.nextWord(correct: true)
        checkDeckOrTime()
    }
    
    private func handlePass() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.pass() }
        if store.soundEnabled { AudioService.shared.play("pass", volume: volume) }
        answerRevealed = false
        showFeedback(correct: false)
        store.nextWord(correct: false)
        checkDeckOrTime()
    }
    
    private func showFeedback(correct: Bool) {
        lastAnswerCorrect = correct
        showAnswerFeedback = true
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 500_000_000)
            showAnswerFeedback = false
        }
    }
    
    private func checkDeckOrTime() {
        if store.currentWord == nil {
            store.endRound()
            showTeamScoreOrNext()
        }
    }
    
    private func teamColor(_ team: Int) -> Color {
        TeamThemeColor.forTeam(team).color
    }
    
    private struct TextSizingResult {
        let fontSize: CGFloat
        let allowHyphenation: Bool
    }
    
    private func calculateTextSizing(for text: String) -> TextSizingResult {
        let words = text.split(separator: " ").map { String($0) }
        let wordCount = words.count
        let longestWordLength = words.map { $0.count }.max() ?? 0
        let totalLength = text.count
        let hasVeryLongWord = longestWordLength >= 13
        
        let maxSize: CGFloat = 72
        let minSize: CGFloat = 36
        
        if wordCount == 1 {
            if longestWordLength <= 10 {
                return TextSizingResult(fontSize: maxSize, allowHyphenation: false)
            } else if longestWordLength <= 14 {
                return TextSizingResult(fontSize: 60, allowHyphenation: false)
            } else {
                return TextSizingResult(fontSize: 50, allowHyphenation: true)
            }
        }
        
        if hasVeryLongWord {
            let sizeFromTotal: CGFloat = {
                switch totalLength {
                case 0...15: return maxSize
                case 16...25: return 60
                case 26...35: return 50
                default: return 44
                }
            }()
            return TextSizingResult(fontSize: max(sizeFromTotal, minSize), allowHyphenation: true)
        } else {
            let sizeFromTotal: CGFloat = {
                switch totalLength {
                case 0...12: return maxSize
                case 13...20: return 60
                case 21...30: return 50
                case 31...40: return 44
                default: return minSize
                }
            }()
            return TextSizingResult(fontSize: max(sizeFromTotal, minSize), allowHyphenation: false)
        }
    }
    
    @ViewBuilder
    private func wordDisplayView(for word: String) -> some View {
        let parsed = parseWordAnswer(word)
        let hasAnswer = parsed.answer != nil
        let promptSizing = calculateTextSizing(for: parsed.prompt)
        let answerSizing = parsed.answer.map { calculateTextSizing(for: $0) }
        
        VStack(spacing: 8) {
            if store.studyMode && answerRevealed, let ans = parsed.answer, let sizing = answerSizing {
                Text(ans)
                    .font(AppFonts.body(size: sizing.fontSize))
                    .minimumScaleFactor(0.6)
                    .lineLimit(nil)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text(parsed.prompt)
                    .font(AppFonts.body(size: promptSizing.fontSize))
                    .minimumScaleFactor(0.6)
                    .lineLimit(nil)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                if store.studyMode && hasAnswer && !answerRevealed {
                    Text("Tap to reveal")
                        .font(AppFonts.body(size: 16))
                        .foregroundStyle(AppColors.mutedText)
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if store.studyMode && hasAnswer && !answerRevealed {
                answerRevealed = true
            }
        }
    }
}
