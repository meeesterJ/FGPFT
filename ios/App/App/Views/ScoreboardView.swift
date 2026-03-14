import SwiftUI

struct ScoreboardView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    
    private var isLastTeamOfRound: Bool {
        store.currentTeam >= store.numberOfTeams
    }
    
    private var isGameOver: Bool {
        store.willGameBeFinished
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
                .ignoresSafeArea()
            
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
            
            HomeButtonOverlay {
                store.resetGame()
                path = NavigationPath()
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            OrientationManager.shared.supportedOrientations = .landscapeLeft
        }
    }
    
    @State private var leaderGlow: Bool = false
    
    private var scoresGrid: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                Text("Team")
                    .font(AppFonts.body(size: 14))
                    .foregroundStyle(.white.opacity(0.6))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 16)
                
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 12))
                    Text("Correct")
                        .font(AppFonts.body(size: 14))
                }
                .foregroundStyle(AppColors.green.opacity(0.8))
                .frame(width: 90)
                
                HStack(spacing: 4) {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 12))
                    Text("Pass")
                        .font(AppFonts.body(size: 14))
                }
                .foregroundStyle(AppColors.pink.opacity(0.8))
                .frame(width: 80)
                .padding(.trailing, 16)
            }
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .padding(.bottom, 8)
            
            ForEach(Array(store.teamTotalScores.enumerated()), id: \.offset) { index, score in
                let teamNumber = index + 1
                let isLeader = leaderIndex == index
                let teamColor = TeamThemeColor.forTeam(teamNumber)
                
                HStack(spacing: 0) {
                    HStack(spacing: 8) {
                        if isLeader {
                            Image(systemName: "crown.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(AppColors.yellow)
                                .shadow(color: AppColors.yellow.opacity(0.8), radius: leaderGlow ? 8 : 4)
                        }
                        
                        Text(store.getTeamName(teamNumber: teamNumber))
                            .font(AppFonts.display(size: 18))
                            .foregroundStyle(Color(hex: String(teamColor.textHex.dropFirst())))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 16)
                    
                    Text("\(score.correct)")
                        .font(AppFonts.display(size: 24).monospacedDigit())
                        .foregroundStyle(AppColors.green)
                        .frame(width: 90)
                    
                    Text("\(score.passed)")
                        .font(AppFonts.display(size: 24).monospacedDigit())
                        .foregroundStyle(AppColors.pink)
                        .frame(width: 80)
                        .padding(.trailing, 16)
                }
                .padding(.vertical, 14)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color(hex: String(teamColor.bgSolidHex.dropFirst())).opacity(0.4))
                        
                        if isLeader {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            AppColors.yellow.opacity(leaderGlow ? 0.25 : 0.15),
                                            AppColors.yellow.opacity(0.05)
                                        ],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                            
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(AppColors.yellow.opacity(leaderGlow ? 0.8 : 0.5), lineWidth: 2)
                                .shadow(color: AppColors.yellow.opacity(0.5), radius: leaderGlow ? 10 : 5)
                        }
                    }
                )
                .padding(.vertical, 4)
            }
        }
        .frame(maxWidth: 500)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                leaderGlow = true
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
