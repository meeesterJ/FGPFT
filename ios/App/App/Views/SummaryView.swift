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
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            VStack(spacing: 24) {
                HStack {
                    Button {
                        OrientationManager.shared.supportedOrientations = UIInterfaceOrientationMask.portrait
                        store.resetGame()
                        path = NavigationPath()
                    } label: {
                        Image(systemName: "house")
                            .font(.title2)
                            .foregroundStyle(.white)
                    }
                    .padding(12)
                    Spacer()
                }
                
                Text("Game Over!")
                    .font(AppFonts.display(size: 52))
                    .foregroundStyle(AppColors.yellow)
                
                if !scores.isEmpty {
                    VStack(spacing: 12) {
                        ForEach(Array(scores.enumerated()), id: \.offset) { i, score in
                            let teamNum = i + 1
                            let isWinner = winnerInfo.map { !$0.isTie && score.correct == $0.maxCorrect } ?? false
                            Button {
                                selectedTeamIndex = i
                            } label: {
                                HStack {
                                    if isWinner {
                                        Image(systemName: "crown.fill")
                                            .foregroundStyle(AppColors.yellow)
                                    }
                                    Text(store.numberOfTeams > 1 ? store.getTeamName(teamNumber: teamNum) : "Score")
                                        .foregroundStyle(teamColor(teamNum))
                                        .lineLimit(1)
                                    Spacer()
                                    HStack(spacing: 16) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundStyle(.green)
                                            Text("\(score.correct)")
                                                .foregroundStyle(.green)
                                                .font(AppFonts.body(size: 17).monospacedDigit())
                                        }
                                        HStack(spacing: 4) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundStyle(.red)
                                            Text("\(score.passed)")
                                                .foregroundStyle(.red)
                                                .font(AppFonts.body(size: 17).monospacedDigit())
                                        }
                                    }
                                }
                                .padding(16)
                                .background(teamColor(teamNum).opacity(0.2))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    if let info = winnerInfo {
                        HStack(spacing: 8) {
                            Image(systemName: "trophy.fill")
                                .foregroundStyle(AppColors.yellow)
                            Text(info.isTie ? "Tie!" : "\(store.getTeamName(teamNumber: info.winnerTeam)) wins!")
                                .font(AppFonts.body(size: 18))
                                .fontWeight(.bold)
                                .foregroundStyle(AppColors.yellow)
                        }
                        .padding(12)
                        .background(AppColors.yellow.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                
                Spacer()
                
                VStack(spacing: 12) {
                    Button {
                        store.startGame()
                        path = NavigationPath()
                        path.append(AppRoute.game)
                    } label: {
                        Label("Play Again", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(AppColors.pink)
                    
                    Button {
                        OrientationManager.shared.supportedOrientations = UIInterfaceOrientationMask.portrait
                        store.resetGame()
                        path = NavigationPath()
                    } label: {
                        Label("Home", systemImage: "house")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                    }
                    .buttonStyle(.bordered)
                    .foregroundStyle(.white)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
            .onAppear {
                OrientationManager.shared.supportedOrientations = UIInterfaceOrientationMask.landscapeRight
                if !playedSounds && store.soundEnabled {
                    playedSounds = true
                    AudioService.shared.play("gameEnd", volume: Float(store.soundVolume) / 100)
                    AudioService.shared.play("applause", volume: Float(store.soundVolume) / 100)
                }
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
    
    private func teamColor(_ team: Int) -> Color {
        let t = TeamThemeColor.forTeam(team)
        return Color(hex: String(t.textHex.dropFirst()))
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
