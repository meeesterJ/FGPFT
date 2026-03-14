import SwiftUI

struct GameView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    @StateObject private var motion = MotionService()
    
    @State private var isWaitingForReady = true
    @State private var showTiltToStart = false
    @State private var isCountingDown = false
    @State private var countdownSec = 3
    @State private var isHandoff = false
    @State private var timeLeft: Int = 30
    @State private var timerTask: Task<Void, Never>?
    @State private var answerRevealed = false
    
    private var volume: Float { Float(store.soundVolume) / 100 }
    
    private var multicoloredRound: some View {
        HStack(spacing: 0) {
            Text("R").foregroundStyle(AppColors.cyan)
            Text("o").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("n").foregroundStyle(AppColors.green)
            Text("d").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: 56))
    }
    
    private var multicoloredStudy: some View {
        HStack(spacing: 0) {
            Text("S").foregroundStyle(AppColors.cyan)
            Text("t").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("d").foregroundStyle(AppColors.green)
            Text("y").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: 120))
    }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            if store.currentWord == nil && !isHandoff {
                ProgressView("Loading…")
                    .tint(.white)
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
        .onChange(of: motion.isAtForehead) { new in showTiltToStart = new }
        .onChange(of: showTiltToStart) { new in if new { motion.startTiltDetection(onForward: { DispatchQueue.main.async { triggerCountdown() } }, onBack: {}) } }
        .onChange(of: store.isGameFinished) { _ in if store.isGameFinished { path.append(AppRoute.summary) } }
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
            if store.studyMode {
                triggerCountdown()
            }
        }
    }
    
    private var multiTeamReadyLayout: some View {
        HStack(spacing: 0) {
            VStack(alignment: .center, spacing: 28) {
                Spacer()
                Text("\(store.getTeamName(teamNumber: store.currentTeam)) Ready?")
                    .font(AppFonts.display(size: 44))
                    .foregroundStyle(teamColor(store.currentTeam))
                
                if store.showButtons || !store.tiltEnabled {
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
                    if showTiltToStart {
                        HStack(spacing: 8) {
                            Image(systemName: "iphone")
                                .font(.system(size: 18))
                            Text("Tilt forward to start")
                        }
                        .font(AppFonts.body(size: 20))
                        .foregroundStyle(AppColors.mutedText)
                    } else if !(store.showButtons || !store.tiltEnabled) {
                        Text("Hold phone at forehead…")
                            .font(AppFonts.body(size: 20))
                            .foregroundStyle(AppColors.mutedText)
                    }
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
                        .font(.system(size: 18))
                    Text("Tap anywhere to start")
                }
                .font(AppFonts.body(size: 20))
                .foregroundStyle(AppColors.mutedText)
            } else if store.showButtons || !store.tiltEnabled {
                if showTiltToStart {
                    HStack(spacing: 8) {
                        Image(systemName: "iphone")
                            .font(.system(size: 18))
                        Text("Tilt forward to start")
                    }
                    .font(AppFonts.body(size: 20))
                    .foregroundStyle(AppColors.mutedText)
                } else {
                    Text("Hold phone at forehead, or tap Start")
                        .font(AppFonts.body(size: 20))
                        .foregroundStyle(AppColors.mutedText)
                }
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
            } else if showTiltToStart {
                HStack(spacing: 8) {
                    Image(systemName: "iphone")
                        .font(.system(size: 18))
                    Text("Tilt forward to start")
                }
                .font(AppFonts.body(size: 20))
                .foregroundStyle(AppColors.mutedText)
            } else {
                Text("Hold phone at forehead…")
                    .font(AppFonts.body(size: 20))
                    .foregroundStyle(AppColors.mutedText)
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
            VStack(spacing: 4) {
                if store.roundDuration > 0 && store.isPlaying {
                    Text("\(timeLeft)s")
                        .font(AppFonts.body(size: 48).monospacedDigit())
                        .foregroundStyle(timeLeft <= 5 ? AppColors.pink : AppColors.green)
                }
                Text("\(store.currentScore)")
                    .font(AppFonts.body(size: 40))
                    .foregroundStyle(AppColors.yellow)
            }
            .frame(width: 80)
            .padding(.leading, 16)
            
            if let word = store.currentWord, word != "No Words!" {
                wordDisplayView(for: word)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.horizontal, 16)
            } else {
                Spacer()
            }
            
            if store.showButtons || !store.tiltEnabled {
                VStack(spacing: 16) {
                    Button {
                        handlePass()
                    } label: {
                        Label("Pass", systemImage: "xmark")
                            .font(AppFonts.body(size: 22))
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    Button {
                        handleCorrect()
                    } label: {
                        Label("Correct", systemImage: "checkmark")
                            .font(AppFonts.body(size: 22))
                            .frame(width: 120, height: 56)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
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
                motion.startMonitoringForReady()
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
        showTiltToStart = store.studyMode
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
        motion.stopMonitoring()
        path.append(AppRoute.roundSummary)
    }
    
    private func handleCorrect() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.correct() }
        if store.soundEnabled { AudioService.shared.play("correct", volume: volume) }
        answerRevealed = false
        store.nextWord(correct: true)
        checkDeckOrTime()
    }
    
    private func handlePass() {
        guard store.isPlaying else { return }
        if store.hapticEnabled { HapticService.pass() }
        if store.soundEnabled { AudioService.shared.play("pass", volume: volume) }
        answerRevealed = false
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
    
    @ViewBuilder
    private func wordDisplayView(for word: String) -> some View {
        let parsed = parseWordAnswer(word)
        let hasAnswer = parsed.answer != nil
        
        VStack(spacing: 8) {
            if store.studyMode && answerRevealed, let ans = parsed.answer {
                Text(ans)
                    .font(AppFonts.body(size: 120))
                    .minimumScaleFactor(0.15)
                    .lineLimit(nil)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text(parsed.prompt)
                    .font(AppFonts.body(size: 120))
                    .minimumScaleFactor(0.15)
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
