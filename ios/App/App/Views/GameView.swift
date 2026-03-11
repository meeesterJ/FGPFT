import SwiftUI

struct GameView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    @StateObject private var motion = MotionService()
    
    @State private var isWaitingForReady = true
    @State private var showTiltToStart = false
    @State private var isCountingDown = false
    @State private var countdownSec = 3
    @State private var showTeamScore = false
    @State private var isHandoff = false
    @State private var timeLeft: Int = 30
    @State private var timerTask: Task<Void, Never>?
    
    private var volume: Float { Float(store.soundVolume) / 100 }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            if store.currentWord == nil && !showTeamScore && !isHandoff {
                ProgressView("Loading…")
                    .tint(.white)
            } else {
                mainGameContent
            }
        }
        .ignoresSafeArea()
        .onAppear(perform: onAppear)
        .onChange(of: motion.isAtForehead) { new in showTiltToStart = new }
        .onChange(of: showTiltToStart) { new in if new { motion.startTiltDetection(onForward: { DispatchQueue.main.async { triggerCountdown() } }, onBack: {}) } }
        .onChange(of: store.isGameFinished) { _ in if store.isGameFinished { path.append(AppRoute.summary) } }
    }
    
    private var mainGameContent: some View {
        ZStack {
            if showTeamScore {
                teamScoreOverlay
            } else if isHandoff {
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
        VStack {
            Spacer()
            if store.numberOfTeams > 1 {
                Text(store.getTeamName(teamNumber: store.currentTeam))
                    .font(.system(size: 56, weight: .bold))
                    .foregroundStyle(teamColor(store.currentTeam))
            }
            Text("Round \(store.currentRound)")
                .font(.largeTitle)
                .foregroundStyle(AppColors.yellow)
            Spacer()
            if showTiltToStart {
                if store.studyMode {
                    Text("Tap anywhere to start")
                        .font(.title3)
                        .foregroundStyle(AppColors.mutedText)
                } else {
                    Text("Tilt forward to start")
                        .font(.title3)
                        .foregroundStyle(AppColors.mutedText)
                    if store.showButtons || !store.tiltEnabled {
                        Button {
                            triggerCountdown()
                        } label: {
                            Label("Play", systemImage: "play.fill")
                                .font(.title2)
                                .padding(.horizontal, 32)
                                .padding(.vertical, 16)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(AppColors.pink)
                        .padding(.top, 8)
                    }
                }
            } else {
                Text("Hold phone at forehead…")
                    .font(.title3)
                    .foregroundStyle(AppColors.mutedText)
            }
            Spacer()
                .frame(height: 60)
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if store.studyMode && showTiltToStart {
                triggerCountdown()
            }
        }
    }
    
    private var countdownOverlay: some View {
        Text(countdownSec > 0 ? "\(countdownSec)" : "Go!")
            .font(.system(size: 120, weight: .thin))
            .foregroundStyle(AppColors.yellow)
    }
    
    private var playingView: some View {
        VStack(spacing: 0) {
            HStack {
                Button {
                    store.resetGame()
                    path.removeLast(path.count)
                } label: {
                    Image(systemName: "house")
                        .font(.title2)
                        .foregroundStyle(.white)
                }
                .padding(12)
                Spacer()
                if store.roundDuration > 0 && store.isPlaying {
                    Text("\(timeLeft)")
                        .font(.system(size: 32, weight: .thin).monospacedDigit())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 20)
                }
                Spacer()
                Color.clear.frame(width: 44, height: 44)
            }
            .padding(.top, 8)
            
            Spacer()
            if let word = store.currentWord, word != "No Words!" {
                let parsed = parseWordAnswer(word)
                VStack(spacing: 8) {
                    Text(parsed.prompt)
                        .font(.system(size: wordFontSize(parsed.prompt), weight: .regular))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    if store.studyMode, let ans = parsed.answer {
                        Text("[\(ans)]")
                            .font(.title3)
                            .foregroundStyle(AppColors.mutedText)
                    }
                }
            }
            Spacer()
            
            if store.showButtons || !store.tiltEnabled {
                HStack(spacing: 40) {
                    Button {
                        handlePass()
                    } label: {
                        Label("Pass", systemImage: "xmark")
                            .font(.title2)
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    Button {
                        handleCorrect()
                    } label: {
                        Label("Correct", systemImage: "checkmark")
                            .font(.title2)
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                }
                .padding(.bottom, 50)
            }
        }
    }
    
    private var teamScoreOverlay: some View {
        VStack {
            Spacer()
            Text(store.getTeamName(teamNumber: store.currentTeam))
                .font(.system(size: 56, weight: .bold))
                .foregroundStyle(teamColor(store.currentTeam))
            Text("Score")
                .font(.largeTitle)
                .foregroundStyle(.white)
            let idx = store.currentTeam - 1
            Text("\(store.teamRoundScores.indices.contains(idx) ? store.teamRoundScores[idx].correct : 0)")
                .font(.system(size: 100, weight: .thin))
                .foregroundStyle(AppColors.yellow)
            Spacer()
            Text("Tap to continue")
                .font(.body)
                .foregroundStyle(AppColors.mutedText)
                .padding(.bottom, 50)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTeamScoreDismiss)
    }
    
    private var handoffOverlay: some View {
        VStack(spacing: 32) {
            Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                .font(.system(size: 44, weight: .bold))
                .foregroundStyle(teamColor(store.currentTeam))
                .multilineTextAlignment(.center)
            Button {
                isHandoff = false
                isWaitingForReady = true
                motion.startMonitoringForReady()
            } label: {
                Text("Ready!")
                    .font(.title)
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
        showTiltToStart = store.studyMode
        showTeamScore = false
        isHandoff = store.numberOfTeams > 1 && store.currentTeam > 1
        if !isHandoff && !store.studyMode {
            motion.startMonitoringForReady()
        }
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
        }
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
        if store.currentTeam < store.numberOfTeams {
            showTeamScore = true
        } else {
            if store.currentRound >= store.totalRounds {
                store.prepareRound()
                if store.isGameFinished {
                    path.append(AppRoute.summary)
                }
            } else {
                store.prepareRound()
                isHandoff = store.numberOfTeams > 1
                if isHandoff {
                    showTeamScore = false
                } else {
                    isWaitingForReady = true
                    showTiltToStart = false
                    motion.startMonitoringForReady()
                }
            }
        }
    }
    
    private func onTeamScoreDismiss() {
        showTeamScore = false
        if store.currentTeam >= store.numberOfTeams {
            if store.currentRound >= store.totalRounds {
                store.prepareRound()
                if store.isGameFinished {
                    path.append(AppRoute.summary)
                    return
                }
            }
            store.prepareRound()
        } else {
            store.prepareRound()
        }
        isHandoff = store.numberOfTeams > 1 && store.currentTeam > 1
        if isHandoff { return }
        isWaitingForReady = true
        showTiltToStart = false
        timeLeft = store.roundDuration == 0 ? 0 : min(store.roundDuration, 599)
        motion.startMonitoringForReady()
    }
    
    private func handleCorrect() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.correct() }
        if store.soundEnabled { AudioService.shared.play("correct", volume: volume) }
        store.nextWord(correct: true)
        checkDeckOrTime()
    }
    
    private func handlePass() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.pass() }
        if store.soundEnabled { AudioService.shared.play("pass", volume: volume) }
        store.nextWord(correct: false)
        checkDeckOrTime()
    }
    
    private func checkDeckOrTime() {
        if store.currentWord == nil {
            store.endRound()
            showTeamScoreOrNext()
        }
    }
    
    private func teamColor(_ team: Int) -> Color {
        let t = TeamThemeColor.forTeam(team)
        return Color(hex: String(t.textHex.dropFirst()))
    }
    
    private func wordFontSize(_ text: String) -> CGFloat {
        let words = text.split(separator: " ")
        let longest = words.map(\.count).max() ?? 0
        let total = text.count
        if longest <= 6 && total <= 10 { return 48 }
        if longest <= 8 { return 42 }
        if longest <= 10 { return 36 }
        if longest <= 13 { return 30 }
        if longest <= 16 { return 26 }
        return 22
    }
}
