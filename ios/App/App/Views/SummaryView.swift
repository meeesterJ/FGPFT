import SwiftUI
import UIKit

struct SummaryView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    @State private var playedSounds = false
    @State private var selectedTeamIndex: Int?
    
    private var scores: [TeamScore] {
        store.teamTotalScores
    }
    
    private var winnerInfo: (isTie: Bool, winnerTeam: Int, maxCorrect: Int)? {
        guard store.numberOfTeams > 1, !scores.isEmpty else { return nil }
        let maxCorrect = scores.map(\.correct).max() ?? 0
        guard maxCorrect > 0 else { return nil }
        let winners = scores.enumerated().filter { $0.element.correct == maxCorrect }.map { $0.offset + 1 }
        return (winners.count > 1, winners[0], maxCorrect)
    }
    
    private func isWinner(teamIndex: Int) -> Bool {
        guard let info = winnerInfo, !info.isTie else { return false }
        return (teamIndex + 1) == info.winnerTeam
    }
    
    /// Width for one score column: two columns fit in landscape without horizontal scrolling.
    private func columnWidth(for geo: GeometryProxy) -> CGFloat {
        let horizontalPadding = LayoutAdaptation.value(compact: 24, pad: 32)
        let gap = LayoutAdaptation.value(compact: 24, pad: 32)
        let inner = geo.size.width - horizontalPadding * 2
        if store.numberOfTeams > 3 {
            return min(LayoutAdaptation.value(compact: 260, pad: 340), (inner - gap) / 2)
        }
        return min(LayoutAdaptation.value(compact: 280, pad: 360), inner)
    }
    
    var body: some View {
        GeometryReader { geo in
            let colW = columnWidth(for: geo)
            ZStack {
                BackgroundView()
                
                VStack(spacing: LayoutAdaptation.value(compact: 16, pad: 22)) {
                    Spacer()
                        .frame(height: geo.safeAreaInsets.top + LayoutAdaptation.value(compact: 20, pad: 28))
                    
                    Text("Game Over!")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 44, pad: 58)))
                        .foregroundStyle(AppColors.yellow)
                    
                    if !scores.isEmpty {
                        Group {
                            if store.numberOfTeams > 3 {
                                HStack(alignment: .top, spacing: LayoutAdaptation.value(compact: 24, pad: 32)) {
                                    scoresTable(forTeamIndices: leftTeamIndices, columnWidth: colW)
                                    scoresTable(forTeamIndices: rightTeamIndices, columnWidth: colW)
                                }
                                .frame(maxWidth: .infinity)
                            } else {
                                HStack {
                                    Spacer(minLength: 0)
                                    scoresTable(forTeamIndices: leftTeamIndices, columnWidth: colW)
                                    Spacer(minLength: 0)
                                }
                            }
                        }
                        .padding(.horizontal, LayoutAdaptation.value(compact: 24, pad: 32))
                    }
                    
                    Spacer()
                    
                    bottomSection
                        .padding(.horizontal, LayoutAdaptation.value(compact: 32, pad: 44))
                        .padding(.bottom, geo.safeAreaInsets.bottom + LayoutAdaptation.value(compact: 24, pad: 36))
                }
                
                HomeButtonOverlay {
                    OrientationManager.shared.supportedOrientations = UIInterfaceOrientationMask.portrait
                    store.resetGame()
                    path = NavigationPath()
                }
            }
        }
        .ignoresSafeArea()
        .navigationBarHidden(true)
        .onAppear {
            OrientationManager.shared.supportedOrientations = .landscapeLeft
            if !playedSounds && store.soundEnabled {
                playedSounds = true
                AudioService.shared.play("gameEnd", volume: Float(store.soundVolume) / 100)
                AudioService.shared.play("applause", volume: Float(store.soundVolume) / 100)
            }
        }
        .sheet(isPresented: Binding(
            get: { selectedTeamIndex != nil },
            set: { if !$0 { selectedTeamIndex = nil } }
        )) {
            if let i = selectedTeamIndex {
                WordListSheet(
                    teamName: store.getTeamName(teamNumber: i + 1),
                    results: store.teamGameResults.indices.contains(i) ? store.teamGameResults[i] : [],
                    onDismiss: { selectedTeamIndex = nil }
                )
            } else {
                EmptyView()
            }
        }
    }
    
    private var leftTeamIndices: [Int] {
        let count = scores.count
        return Array(0..<min(3, count))
    }
    
    private var rightTeamIndices: [Int] {
        let count = scores.count
        return Array(3..<min(5, count))
    }
    
    private func scoresTable(forTeamIndices indices: [Int], columnWidth: CGFloat) -> some View {
        VStack(spacing: 4) {
            headerRow
                .padding(.bottom, 4)
            
            ForEach(indices, id: \.self) { teamIndex in
                teamRow(teamIndex: teamIndex, totalScore: scores[teamIndex])
            }
        }
        .frame(width: columnWidth)
    }
    
    private var headerRow: some View {
        let totalColW = LayoutAdaptation.value(compact: 70, pad: 88)
        return HStack(spacing: 8) {
            Text("Team")
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, LayoutAdaptation.value(compact: 12, pad: 16))
            
            Text("Total")
                .frame(width: totalColW)
                .padding(.trailing, LayoutAdaptation.value(compact: 12, pad: 16))
        }
        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 13, pad: 17)))
        .foregroundStyle(.white.opacity(0.6))
        .padding(.vertical, LayoutAdaptation.value(compact: 8, pad: 12))
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 8, pad: 12)))
    }
    
    private func teamRow(teamIndex: Int, totalScore: TeamScore) -> some View {
        let teamNum = teamIndex + 1
        let winner = isWinner(teamIndex: teamIndex)
        let totalColW = LayoutAdaptation.value(compact: 70, pad: 88)
        let bodyFont = LayoutAdaptation.value(compact: 15, pad: 20)
        let symSmall = LayoutAdaptation.value(compact: 11, pad: 14)
        let crownSz = LayoutAdaptation.value(compact: 14, pad: 18)
        let cornerR = LayoutAdaptation.value(compact: 10, pad: 14)
        
        return Button {
            selectedTeamIndex = teamIndex
        } label: {
            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    if winner {
                        Image(systemName: "crown.fill")
                            .font(AppFonts.sfSymbol(size: crownSz))
                            .foregroundStyle(AppColors.yellow)
                    }
                    Text(store.numberOfTeams > 1 ? store.getTeamName(teamNumber: teamNum) : "Score")
                        .font(AppFonts.body(size: bodyFont))
                        .fontWeight(.semibold)
                        .foregroundStyle(teamColor(teamNum))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, LayoutAdaptation.value(compact: 12, pad: 16))
                
                VStack(spacing: 1) {
                    HStack(spacing: 2) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(AppFonts.sfSymbol(size: symSmall))
                        Text("\(totalScore.correct)")
                            .font(AppFonts.body(size: bodyFont).monospacedDigit().bold())
                    }
                    .foregroundStyle(AppColors.green)
                    
                    HStack(spacing: 2) {
                        Image(systemName: "xmark.circle.fill")
                            .font(AppFonts.sfSymbol(size: symSmall))
                        Text("\(totalScore.passed)")
                            .font(AppFonts.body(size: bodyFont).monospacedDigit().bold())
                    }
                    .foregroundStyle(AppColors.pink)
                }
                .frame(width: totalColW)
                .padding(.trailing, LayoutAdaptation.value(compact: 12, pad: 16))
            }
            .padding(.vertical, LayoutAdaptation.value(compact: 10, pad: 14))
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: cornerR)
                        .fill(teamColor(teamNum).opacity(0.15))
                    
                    if winner {
                        RoundedRectangle(cornerRadius: cornerR)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        AppColors.yellow.opacity(0.2),
                                        AppColors.yellow.opacity(0.05)
                                    ],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                        
                        RoundedRectangle(cornerRadius: cornerR)
                            .stroke(AppColors.yellow.opacity(0.5), lineWidth: 1.5)
                    }
                }
            )
        }
        .buttonStyle(.plain)
    }
    
    private var bottomSection: some View {
        HStack(spacing: LayoutAdaptation.value(compact: 24, pad: 32)) {
            Spacer(minLength: 0)
            
            if let info = winnerInfo {
                let winnerAccent = info.isTie ? AppColors.yellow : teamColor(info.winnerTeam)
                HStack(spacing: LayoutAdaptation.value(compact: 12, pad: 16)) {
                    Image(systemName: "trophy.fill")
                        .font(AppFonts.sfSymbol(size: LayoutAdaptation.value(compact: 40, pad: 52)))
                        .foregroundStyle(winnerAccent)
                    
                    Text(info.isTie ? "It's a Tie!" : "\(store.getTeamName(teamNumber: info.winnerTeam)) wins!")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 24, pad: 32)))
                        .foregroundStyle(winnerAccent)
                        .lineLimit(1)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.7)
                }
                .padding(.vertical, LayoutAdaptation.value(compact: 16, pad: 22))
                .padding(.horizontal, LayoutAdaptation.value(compact: 16, pad: 22))
                .background(winnerAccent.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 16, pad: 20)))
            }
            
            Button {
                store.startGame()
                path = NavigationPath()
                path.append(AppRoute.game)
            } label: {
                Label("Play Again", systemImage: "arrow.clockwise")
                    .font(AppFonts.body(size: LayoutAdaptation.value(compact: 18, pad: 24)))
                    .fontWeight(.bold)
                    .padding(.horizontal, LayoutAdaptation.value(compact: 24, pad: 36))
                    .padding(.vertical, LayoutAdaptation.value(compact: 16, pad: 22))
            }
            .buttonStyle(.borderedProminent)
            .tint(AppColors.pink)
            
            Spacer(minLength: 0)
        }
    }
    
    private func teamColor(_ team: Int) -> Color {
        TeamThemeColor.forTeam(team).color
    }
}

private struct WordListSheet: View {
    let teamName: String
    let results: [(word: String, correct: Bool)]
    let onDismiss: () -> Void
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(Array(results.enumerated()), id: \.offset) { _, r in
                    HStack {
                        Text(r.word)
                        Spacer()
                        Image(systemName: r.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(r.correct ? .green : .red)
                    }
                }
            }
            .navigationTitle("\(teamName) — All Rounds")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { onDismiss() }
                }
            }
        }
    }
}
