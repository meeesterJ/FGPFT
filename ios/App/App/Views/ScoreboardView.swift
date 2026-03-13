import SwiftUI

struct ScoreboardView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    
    private var isLastTeamOfRound: Bool {
        store.currentTeam >= store.numberOfTeams
    }
    
    private var isLastRound: Bool {
        store.currentRound >= store.totalRounds
    }
    
    private var isGameOver: Bool {
        isLastTeamOfRound && isLastRound
    }
    
    private var leaderIndex: Int? {
        guard store.teamTotalScores.count > 1 else { return nil }
        let maxScore = store.teamTotalScores.map(\.correct).max() ?? 0
        guard maxScore > 0 else { return nil }
        let leaders = store.teamTotalScores.enumerated().filter { $0.element.correct == maxScore }
        return leaders.count == 1 ? leaders.first?.offset : nil
    }
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            VStack(spacing: 24) {
                Spacer()
                
                Text("Scoreboard")
                    .font(AppFonts.display(size: 44))
                    .foregroundStyle(.white)
                
                scoresGrid
                
                Spacer()
                
                bottomButton
                    .padding(.bottom, 32)
            }
            .padding(.horizontal, 32)
            
            homeButton
        }
        .ignoresSafeArea()
        .navigationBarHidden(true)
        .onAppear {
            OrientationManager.shared.supportedOrientations = .landscapeLeft
        }
    }
    
    private var homeButton: some View {
        VStack {
            HStack {
                Button {
                    store.resetGame()
                    path = NavigationPath()
                } label: {
                    Image(systemName: "house.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.white.opacity(0.15))
                        .clipShape(Circle())
                }
                .padding(.leading, 16)
                .padding(.top, 16)
                Spacer()
            }
            Spacer()
        }
    }
    
    private var scoresGrid: some View {
        HStack(spacing: 16) {
            ForEach(Array(store.teamTotalScores.enumerated()), id: \.offset) { index, score in
                let teamNumber = index + 1
                let isLeader = leaderIndex == index
                let teamColor = TeamThemeColor.forTeam(teamNumber)
                
                VStack(spacing: 12) {
                    if isLeader {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(AppColors.yellow)
                    } else {
                        Color.clear.frame(height: 24)
                    }
                    
                    Text(store.getTeamName(teamNumber: teamNumber))
                        .font(AppFonts.display(size: 20))
                        .foregroundStyle(Color(hex: String(teamColor.textHex.dropFirst())))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    
                    Text("\(score.correct)")
                        .font(AppFonts.display(size: 56))
                        .foregroundStyle(AppColors.yellow)
                    
                    HStack(spacing: 16) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(AppColors.green)
                                .font(.system(size: 14))
                            Text("\(score.correct)")
                                .font(AppFonts.body(size: 14).monospacedDigit())
                                .foregroundStyle(AppColors.green)
                        }
                        HStack(spacing: 4) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(AppColors.pink)
                                .font(.system(size: 14))
                            Text("\(score.passed)")
                                .font(AppFonts.body(size: 14).monospacedDigit())
                                .foregroundStyle(AppColors.pink)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(hex: String(teamColor.bgSolidHex.dropFirst())).opacity(0.5))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            isLeader ? AppColors.yellow.opacity(0.5) : Color(hex: String(teamColor.textHex.dropFirst())).opacity(0.3),
                            lineWidth: isLeader ? 2 : 1
                        )
                )
            }
        }
    }
    
    private var bottomButton: some View {
        Button {
            if isGameOver {
                store.prepareRound()
                path.append(AppRoute.summary)
            } else {
                store.prepareRound()
                path.removeLast(2)
            }
        } label: {
            HStack(spacing: 8) {
                if isGameOver {
                    Text("AND THE WINNER IS...")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                    Image(systemName: "trophy.fill")
                } else if isLastTeamOfRound {
                    Text("Next Round...")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                    Image(systemName: "arrow.right")
                } else {
                    Text("Next Team Ready?")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                    Image(systemName: "arrow.right")
                }
            }
            .frame(maxWidth: 320)
            .padding(.vertical, 16)
        }
        .buttonStyle(.borderedProminent)
        .tint(AppColors.pink)
    }
}
