import SwiftUI

struct ScoreboardView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore

    private let tableColumnWidth: CGFloat = 320
    
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
        GeometryReader { geo in
            ZStack {
                BackgroundView()
                
                VStack(spacing: 24) {
                    Spacer()
                    
                    Text("Scoreboard")
                        .font(AppFonts.display(size: 44))
                        .foregroundStyle(AppColors.yellow)
                    
                    scoresTables
                    
                    Spacer()
                    
                    bottomButtonRow
                        .padding(.bottom, 32)
                }
                .padding(.horizontal, 32)
                
                HomeButtonOverlay {
                    store.resetGame()
                    path = NavigationPath()
                }
            }
        }
        .ignoresSafeArea()
        .navigationBarHidden(true)
        .onAppear {
            OrientationManager.shared.supportedOrientations = .landscapeLeft
        }
    }
    
    @State private var leaderGlow: Bool = false
    
    private var totalTeams: Int {
        store.teamTotalScores.count
    }
    
    private var scoresTables: some View {
        HStack(alignment: .top, spacing: 24) {
            leftTeamsTable
                .frame(width: tableColumnWidth)
            
            rightTeamsTable
                .frame(width: tableColumnWidth)
        }
        .frame(maxWidth: 700)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                leaderGlow = true
            }
        }
    }
    
    private var leftTeamsTable: some View {
        let visibleCount = min(3, max(0, totalTeams))
        let visibleTeams: [Int] = visibleCount > 0 ? Array(1...visibleCount) : []
        
        return VStack(spacing: 0) {
            tableHeader
            
            ForEach(visibleTeams, id: \.self) { teamNumber in
                let score = store.teamTotalScores[teamNumber - 1]
                teamRow(teamNumber: teamNumber, score: score)
            }
        }
    }
    
    private var rightTeamsTable: some View {
        let shouldShowRightTable = totalTeams > 3
        let rightSlots = [4, 5]

        return VStack(spacing: 0) {
            tableHeader
                .opacity(shouldShowRightTable ? 1 : 0) // reserve space so button doesn't move
            
            ForEach(rightSlots, id: \.self) { teamNumber in
                let isAvailable = teamNumber <= totalTeams
                let score = isAvailable ? store.teamTotalScores[teamNumber - 1] : TeamScore()
                
                teamRow(teamNumber: teamNumber, score: score)
                    .opacity(isAvailable ? 1 : 0)
            }
        }
    }
    
    private var tableHeader: some View {
        HStack(spacing: 0) {
            Text("Team")
                .font(AppFonts.body(size: 14))
                .foregroundStyle(.white.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 16)
            
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(AppFonts.sfSymbol(size: 12))
                Text("Correct")
                    .font(AppFonts.body(size: 14))
            }
            .foregroundStyle(AppColors.green.opacity(0.8))
            .frame(width: 90)
            
            HStack(spacing: 4) {
                Image(systemName: "arrow.right.circle.fill")
                    .font(AppFonts.sfSymbol(size: 12))
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
    }
    
    private func teamRow(teamNumber: Int, score: TeamScore) -> some View {
        let isLeader = (leaderIndex == teamNumber - 1)
        let teamColor = TeamThemeColor.forTeam(teamNumber)
        
        return HStack(spacing: 0) {
            HStack(spacing: 8) {
                if isLeader {
                    Image(systemName: "crown.fill")
                        .font(AppFonts.sfSymbol(size: 16))
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
    
    private var bottomButtonRow: some View {
        HStack(spacing: 24) {
            Color.clear
                .frame(width: tableColumnWidth)
            
            bottomButton
                .frame(width: tableColumnWidth, alignment: .trailing)
        }
        .frame(maxWidth: 700)
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
                    Text("\(store.getTeamName(teamNumber: store.currentTeam + 1)) Ready?")
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
