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
        MulticoloredRoundText(fontSize: LayoutAdaptation.value(compact: 56, pad: 76))
    }
    
    private var multicoloredStudy: some View {
        MulticoloredStudyText(fontSize: LayoutAdaptation.value(compact: 120, pad: 160))
    }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            if store.currentWord == nil && !isHandoff {
                VStack(spacing: LayoutAdaptation.value(compact: 14, pad: 22)) {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(LayoutAdaptation.value(compact: 1.0, pad: 1.35))
                    Text("Loading…")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 16, pad: 22)))
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
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentShape(Rectangle())
        .onTapGesture {
            triggerCountdown()
        }
    }
    
    private var multiTeamReadyLayout: some View {
        HStack(spacing: 0) {
            VStack(alignment: .center, spacing: LayoutAdaptation.value(compact: 28, pad: 36)) {
                Spacer()
                Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                    .font(AppFonts.display(size: LayoutAdaptation.value(compact: 44, pad: 58)))
                    .foregroundStyle(teamColor(store.currentTeam))
                
                if shouldShowStartButton {
                    Button {
                        triggerCountdown()
                    } label: {
                        Label("Start", systemImage: "play.fill")
                            .font(AppFonts.body(size: LayoutAdaptation.value(compact: 22, pad: 28)))
                            .padding(.horizontal, LayoutAdaptation.value(compact: 32, pad: 44))
                            .padding(.vertical, LayoutAdaptation.value(compact: 16, pad: 22))
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
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 180, pad: 230)))
                        .foregroundStyle(AppColors.yellow)
                }
                Spacer()
                if !store.studyMode {
                    VStack(spacing: 4) {
                        Text("Raise phone to forehead.")
                        Text("Tap screen when ready.")
                    }
                    .font(AppFonts.body(size: LayoutAdaptation.value(compact: 20, pad: 26)))
                    .foregroundStyle(AppColors.mutedText)
                }
                Spacer()
                    .frame(height: LayoutAdaptation.value(compact: 60, pad: 80))
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
                    .font(AppFonts.display(size: LayoutAdaptation.value(compact: 180, pad: 230)))
                    .foregroundStyle(AppColors.yellow)
            }
            Spacer()
            if store.studyMode {
                HStack(spacing: 8) {
                    Image(systemName: "iphone")
                        .font(AppFonts.sfSymbol(size: LayoutAdaptation.value(compact: 18, pad: 24)))
                    Text("Tap anywhere to start")
                }
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 20, pad: 26)))
                .foregroundStyle(AppColors.mutedText)
            } else {
                VStack(spacing: 4) {
                    Text("Raise phone to forehead.")
                    Text("Tap screen when ready.")
                }
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 20, pad: 26)))
                .foregroundStyle(AppColors.mutedText)
                
                if shouldShowStartButton {
                    Button {
                        triggerCountdown()
                    } label: {
                        Label("Start", systemImage: "play.fill")
                            .font(AppFonts.body(size: LayoutAdaptation.value(compact: 22, pad: 28)))
                            .padding(.horizontal, LayoutAdaptation.value(compact: 32, pad: 44))
                            .padding(.vertical, LayoutAdaptation.value(compact: 16, pad: 22))
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppColors.pink)
                    .padding(.top, 8)
                }
            }
            Spacer()
                .frame(height: LayoutAdaptation.value(compact: 60, pad: 80))
        }
    }
    
    private var countdownOverlay: some View {
        Text(countdownSec > 0 ? "\(countdownSec)" : "Go!")
            .font(AppFonts.display(size: LayoutAdaptation.value(compact: 120, pad: 160)))
            .foregroundStyle(AppColors.yellow)
    }
    
    private var showTouchGameControls: Bool {
        store.showButtons || !store.tiltEnabled
    }
    
    /// Timer, score, and last-answer icon (shared by iPhone and iPad playing layouts).
    private var timerScoreColumn: some View {
        let iconBox: CGFloat = LayoutAdaptation.value(compact: 36, pad: 44)
        return VStack(spacing: 4) {
            Group {
                if store.roundDuration > 0 && store.isPlaying {
                    Text("\(timeLeft)s")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 48, pad: 60)).monospacedDigit())
                        .foregroundStyle(timeLeft <= 5 ? AppColors.pink : AppColors.green)
                } else {
                    Color.clear
                }
            }
            .frame(height: LayoutAdaptation.value(compact: 52, pad: 64))
            
            Text("\(store.currentScore)")
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 40, pad: 52)))
                .foregroundStyle(AppColors.yellow)
            
            ZStack {
                Color.clear
                    .frame(width: iconBox, height: iconBox)
                Image(systemName: (lastAnswerCorrect ?? false) ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(AppFonts.sfSymbol(size: iconBox))
                    .foregroundStyle((lastAnswerCorrect ?? false) ? AppColors.green : AppColors.pink)
                    .opacity(showAnswerFeedback ? 1 : 0)
            }
            .frame(width: iconBox, height: iconBox)
        }
        .frame(width: LayoutAdaptation.value(compact: 80, pad: 100))
        .padding(.leading, LayoutAdaptation.value(compact: 16, pad: 24))
        .animation(.easeInOut(duration: 0.2), value: showAnswerFeedback)
    }
    
    private var passGameControlButton: some View {
        Button {
            handlePass()
        } label: {
            Label("Pass", systemImage: "xmark")
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 22, pad: 28)))
                .frame(
                    width: LayoutAdaptation.value(compact: 120, pad: 176),
                    height: LayoutAdaptation.value(compact: 56, pad: 78)
                )
        }
        .buttonStyle(.borderedProminent)
        .tint(.red)
    }
    
    private var correctGameControlButton: some View {
        Button {
            handleCorrect()
        } label: {
            Label("Correct", systemImage: "checkmark")
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 22, pad: 28)))
                .frame(
                    width: LayoutAdaptation.value(compact: 120, pad: 176),
                    height: LayoutAdaptation.value(compact: 56, pad: 78)
                )
        }
        .buttonStyle(.borderedProminent)
        .tint(.green)
    }
    
    @ViewBuilder
    private var playingView: some View {
        if LayoutAdaptation.isPad {
            playingViewPad
        } else {
            playingViewPhone
        }
    }
    
    /// iPhone: trailing column with Pass above Correct (unchanged from original layout).
    private var playingViewPhone: some View {
        HStack(spacing: 0) {
            timerScoreColumn
            
            if let word = store.currentWord, word != "No Words!" {
                wordDisplayView(for: word)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.horizontal, LayoutAdaptation.value(compact: 16, pad: 28))
            } else {
                Spacer()
            }
            
            if showTouchGameControls {
                VStack {
                    passGameControlButton
                        .padding(.top, LayoutAdaptation.value(compact: 16, pad: 22))
                    Spacer()
                    correctGameControlButton
                        .padding(.bottom, LayoutAdaptation.value(compact: 16, pad: 22))
                }
                .padding(.trailing, LayoutAdaptation.value(compact: 24, pad: 32))
            } else {
                Color.clear.frame(width: LayoutAdaptation.value(compact: 24, pad: 32))
            }
        }
    }
    
    /// iPad: Pass bottom-leading, Correct bottom-trailing for thumb reach (LTR).
    private var playingViewPad: some View {
        GeometryReader { geo in
            let edgePad: CGFloat = LayoutAdaptation.value(compact: 28, pad: 40)
            let bottomPad: CGFloat = LayoutAdaptation.value(compact: 34, pad: 48)
            ZStack(alignment: .bottom) {
                HStack(spacing: 0) {
                    timerScoreColumn
                    if let word = store.currentWord, word != "No Words!" {
                        wordDisplayView(for: word)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .padding(.horizontal, LayoutAdaptation.value(compact: 16, pad: 28))
                    } else {
                        Spacer()
                    }
                }
                
                if showTouchGameControls {
                    HStack(alignment: .bottom) {
                        passGameControlButton
                        Spacer()
                        correctGameControlButton
                    }
                    .padding(.leading, geo.safeAreaInsets.leading + edgePad)
                    .padding(.trailing, geo.safeAreaInsets.trailing + edgePad)
                    .padding(.bottom, geo.safeAreaInsets.bottom + bottomPad)
                }
            }
        }
    }
    
    private var handoffOverlay: some View {
        VStack(spacing: LayoutAdaptation.value(compact: 32, pad: 44)) {
            Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                .font(AppFonts.display(size: LayoutAdaptation.value(compact: 44, pad: 58)))
                .foregroundStyle(teamColor(store.currentTeam))
                .multilineTextAlignment(.center)
            Button {
                isHandoff = false
                isWaitingForReady = true
            } label: {
                Text("Ready!")
                    .font(AppFonts.body(size: LayoutAdaptation.value(compact: 24, pad: 30)))
                    .padding(.horizontal, LayoutAdaptation.value(compact: 48, pad: 60))
                    .padding(.vertical, LayoutAdaptation.value(compact: 20, pad: 28))
            }
            .buttonStyle(.borderedProminent)
            .tint(teamColor(store.currentTeam))
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
        
        let maxSize: CGFloat = LayoutAdaptation.value(compact: 72, pad: 96)
        let minSize: CGFloat = LayoutAdaptation.value(compact: 36, pad: 46)
        let tierA: CGFloat = LayoutAdaptation.value(compact: 60, pad: 78)
        let tierB: CGFloat = LayoutAdaptation.value(compact: 50, pad: 66)
        let tierC: CGFloat = LayoutAdaptation.value(compact: 44, pad: 56)
        
        if wordCount == 1 {
            if longestWordLength <= 10 {
                return TextSizingResult(fontSize: maxSize, allowHyphenation: false)
            } else if longestWordLength <= 14 {
                return TextSizingResult(fontSize: tierA, allowHyphenation: false)
            } else {
                return TextSizingResult(fontSize: tierB, allowHyphenation: true)
            }
        }
        
        if hasVeryLongWord {
            let sizeFromTotal: CGFloat = {
                switch totalLength {
                case 0...15: return maxSize
                case 16...25: return tierA
                case 26...35: return tierB
                default: return tierC
                }
            }()
            return TextSizingResult(fontSize: max(sizeFromTotal, minSize), allowHyphenation: true)
        } else {
            let sizeFromTotal: CGFloat = {
                switch totalLength {
                case 0...12: return maxSize
                case 13...20: return tierA
                case 21...30: return tierB
                case 31...40: return tierC
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
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 16, pad: 22)))
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
