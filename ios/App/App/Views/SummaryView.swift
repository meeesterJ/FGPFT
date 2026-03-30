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
        let horizontalPadding: CGFloat = 24
        let gap: CGFloat = 24
        let inner = geo.size.width - horizontalPadding * 2
        if store.numberOfTeams > 3 {
            return min(260, (inner - gap) / 2)
        }
        return min(280, inner)
    }
    
    var body: some View {
        GeometryReader { geo in
            let colW = columnWidth(for: geo)
            ZStack {
                BackgroundView()
                
                VStack(spacing: 16) {
                    Spacer()
                        .frame(height: geo.safeAreaInsets.top + 20)
                    
                    Text("Game Over!")
                        .font(AppFonts.display(size: 44))
                        .foregroundStyle(AppColors.yellow)
                    
                    if !scores.isEmpty {
                        Group {
                            if store.numberOfTeams > 3 {
                                HStack(alignment: .top, spacing: 24) {
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
                        .padding(.horizontal, 24)
                    }
                    
                    Spacer()
                    
                    bottomSection
                        .padding(.horizontal, 32)
                        .padding(.bottom, geo.safeAreaInsets.bottom + 24)
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
        HStack(spacing: 8) {
            Text("Team")
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 12)
            
            Text("Total")
                .frame(width: 70)
                .padding(.trailing, 12)
        }
        .font(AppFonts.body(size: 13))
        .foregroundStyle(.white.opacity(0.6))
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    private func teamRow(teamIndex: Int, totalScore: TeamScore) -> some View {
        let teamNum = teamIndex + 1
        let winner = isWinner(teamIndex: teamIndex)
        
        return Button {
            selectedTeamIndex = teamIndex
        } label: {
            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    if winner {
                        Image(systemName: "crown.fill")
                            .font(AppFonts.sfSymbol(size: 14))
                            .foregroundStyle(AppColors.yellow)
                    }
                    Text(store.numberOfTeams > 1 ? store.getTeamName(teamNumber: teamNum) : "Score")
                        .font(AppFonts.body(size: 15))
                        .fontWeight(.semibold)
                        .foregroundStyle(teamColor(teamNum))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 12)
                
                VStack(spacing: 1) {
                    HStack(spacing: 2) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(AppFonts.sfSymbol(size: 11))
                        Text("\(totalScore.correct)")
                            .font(AppFonts.body(size: 15).monospacedDigit().bold())
                    }
                    .foregroundStyle(AppColors.green)
                    
                    HStack(spacing: 2) {
                        Image(systemName: "xmark.circle.fill")
                            .font(AppFonts.sfSymbol(size: 11))
                        Text("\(totalScore.passed)")
                            .font(AppFonts.body(size: 15).monospacedDigit().bold())
                    }
                    .foregroundStyle(AppColors.pink)
                }
                .frame(width: 70)
                .padding(.trailing, 12)
            }
            .padding(.vertical, 10)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(teamColor(teamNum).opacity(0.15))
                    
                    if winner {
                        RoundedRectangle(cornerRadius: 10)
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
                        
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(AppColors.yellow.opacity(0.5), lineWidth: 1.5)
                    }
                }
            )
        }
        .buttonStyle(.plain)
    }
    
    private var bottomSection: some View {
        HStack(spacing: 24) {
            Spacer(minLength: 0)
            
            if let info = winnerInfo {
                HStack(spacing: 12) {
                    Image(systemName: "trophy.fill")
                        .font(AppFonts.sfSymbol(size: 40))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text(info.isTie ? "It's a Tie!" : "\(store.getTeamName(teamNumber: info.winnerTeam)) wins!")
                        .font(AppFonts.display(size: 24))
                        .foregroundStyle(AppColors.yellow)
                        .lineLimit(1)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.7)
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 16)
                .background(AppColors.yellow.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            
            Button {
                store.startGame()
                path = NavigationPath()
                path.append(AppRoute.game)
            } label: {
                Label("Play Again", systemImage: "arrow.clockwise")
                    .font(AppFonts.body(size: 18))
                    .fontWeight(.bold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
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
