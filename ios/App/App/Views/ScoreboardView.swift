import SwiftUI

struct ScoreboardView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore

    private var tableColumnWidth: CGFloat {
        LayoutAdaptation.value(compact: 320, pad: 420)
    }
    
    private var scoresMaxWidth: CGFloat {
        LayoutAdaptation.value(compact: 700, pad: 960)
    }
    
    private var correctColumnWidth: CGFloat {
        LayoutAdaptation.value(compact: 90, pad: 108)
    }
    
    private var passColumnWidth: CGFloat {
        LayoutAdaptation.value(compact: 80, pad: 96)
    }
    
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
                
                VStack(spacing: LayoutAdaptation.value(compact: 12, pad: 18)) {
                    Text("Scoreboard")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 44, pad: 58)))
                        .foregroundStyle(AppColors.yellow)
                    
                    VStack(spacing: LayoutAdaptation.value(compact: 6, pad: 10)) {
                        scoresTables
                        
                        bottomButtonRow
                            .padding(.bottom, geo.safeAreaInsets.bottom + LayoutAdaptation.value(compact: 8, pad: 14))
                    }
                }
                .padding(.top, geo.safeAreaInsets.top + LayoutAdaptation.value(compact: 32, pad: 44))
                .padding(.horizontal, LayoutAdaptation.value(compact: 32, pad: 44))
                
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
        Group {
            if totalTeams > 3 {
                HStack(alignment: .top, spacing: LayoutAdaptation.value(compact: 24, pad: 32)) {
                    leftTeamsTable
                        .frame(width: tableColumnWidth)
                    
                    rightTeamsTable
                        .frame(width: tableColumnWidth)
                }
            } else {
                leftTeamsTable
                    .frame(width: tableColumnWidth)
            }
        }
        .frame(maxWidth: scoresMaxWidth, alignment: .center)
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
        let labelFont: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        let iconSmall: CGFloat = LayoutAdaptation.value(compact: 12, pad: 15)
        return HStack(spacing: 0) {
            Text("Team")
                .font(AppFonts.body(size: labelFont))
                .foregroundStyle(.white.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, LayoutAdaptation.value(compact: 16, pad: 22))
            
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(AppFonts.sfSymbol(size: iconSmall))
                Text("Correct")
                    .font(AppFonts.body(size: labelFont))
            }
            .foregroundStyle(AppColors.green.opacity(0.8))
            .frame(width: correctColumnWidth)
            
            HStack(spacing: 4) {
                Image(systemName: "arrow.right.circle.fill")
                    .font(AppFonts.sfSymbol(size: iconSmall))
                Text("Pass")
                    .font(AppFonts.body(size: labelFont))
            }
            .foregroundStyle(AppColors.pink.opacity(0.8))
            .frame(width: passColumnWidth)
            .padding(.trailing, LayoutAdaptation.value(compact: 16, pad: 22))
        }
        .padding(.vertical, LayoutAdaptation.value(compact: 10, pad: 14))
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 12, pad: 14), style: .continuous))
        .padding(.bottom, LayoutAdaptation.value(compact: 8, pad: 12))
    }
    
    private func teamRow(teamNumber: Int, score: TeamScore) -> some View {
        let isLeader = (leaderIndex == teamNumber - 1)
        let teamColor = TeamThemeColor.forTeam(teamNumber)
        let nameSize: CGFloat = LayoutAdaptation.value(compact: 18, pad: 24)
        let scoreSize: CGFloat = LayoutAdaptation.value(compact: 24, pad: 32)
        let crownSize: CGFloat = LayoutAdaptation.value(compact: 16, pad: 22)
        let rowPadV: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        let rowOuterPad: CGFloat = LayoutAdaptation.value(compact: 4, pad: 6)
        let cornerR: CGFloat = LayoutAdaptation.value(compact: 12, pad: 14)
        
        return HStack(spacing: 0) {
            HStack(spacing: 8) {
                if isLeader {
                    Image(systemName: "crown.fill")
                        .font(AppFonts.sfSymbol(size: crownSize))
                        .foregroundStyle(AppColors.yellow)
                        .shadow(color: AppColors.yellow.opacity(0.8), radius: leaderGlow ? 8 : 4)
                }
                
                Text(store.getTeamName(teamNumber: teamNumber))
                    .font(AppFonts.display(size: nameSize))
                    .foregroundStyle(Color(hex: String(teamColor.textHex.dropFirst())))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, LayoutAdaptation.value(compact: 16, pad: 22))
            
            Text("\(score.correct)")
                .font(AppFonts.display(size: scoreSize).monospacedDigit())
                .foregroundStyle(AppColors.green)
                .frame(width: correctColumnWidth)
            
            Text("\(score.passed)")
                .font(AppFonts.display(size: scoreSize).monospacedDigit())
                .foregroundStyle(AppColors.pink)
                .frame(width: passColumnWidth)
                .padding(.trailing, LayoutAdaptation.value(compact: 16, pad: 22))
        }
        .padding(.vertical, rowPadV)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: cornerR, style: .continuous)
                    .fill(Color(hex: String(teamColor.bgSolidHex.dropFirst())).opacity(0.4))
                
                if isLeader {
                    RoundedRectangle(cornerRadius: cornerR, style: .continuous)
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
                    
                    RoundedRectangle(cornerRadius: cornerR, style: .continuous)
                        .stroke(AppColors.yellow.opacity(leaderGlow ? 0.8 : 0.5), lineWidth: 2)
                        .shadow(color: AppColors.yellow.opacity(0.5), radius: leaderGlow ? 10 : 5)
                }
            }
        )
        .padding(.vertical, rowOuterPad)
    }
    
    private var bottomButtonRow: some View {
        Group {
            if totalTeams > 3 {
                HStack(spacing: LayoutAdaptation.value(compact: 24, pad: 32)) {
                    Color.clear
                        .frame(width: tableColumnWidth)
                    
                    bottomButton
                        .frame(width: tableColumnWidth)
                }
                .frame(maxWidth: scoresMaxWidth)
            } else {
                bottomButton
                    .frame(width: tableColumnWidth)
                    .frame(maxWidth: scoresMaxWidth, alignment: .center)
            }
        }
    }
    
    private var bottomButton: some View {
        let teamReadyTint = TeamThemeColor.forTeam(store.currentTeam + 1).color
        let tintColor: Color = (isGameOver || isLastTeamOfRound) ? AppColors.pink : teamReadyTint
        let btnFont: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        let btnIcon: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        return Button {
            if isGameOver {
                store.prepareRound()
                path.append(AppRoute.summary)
            } else {
                store.prepareRound()
                path.removeLast(2)
            }
        } label: {
            HStack(spacing: 6) {
                if isGameOver {
                    Text("AND THE WINNER IS...")
                        .font(AppFonts.body(size: btnFont))
                        .fontWeight(.semibold)
                    Image(systemName: "trophy.fill")
                        .font(AppFonts.sfSymbol(size: btnIcon))
                } else if isLastTeamOfRound {
                    Text("Next Round...")
                        .font(AppFonts.body(size: btnFont))
                        .fontWeight(.semibold)
                    Image(systemName: "arrow.right")
                        .font(AppFonts.sfSymbol(size: btnIcon))
                } else {
                    Text("\(store.getTeamName(teamNumber: store.currentTeam + 1)) Ready?")
                        .font(AppFonts.body(size: btnFont))
                        .fontWeight(.semibold)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                    Image(systemName: "arrow.right")
                        .font(AppFonts.sfSymbol(size: btnIcon))
                }
            }
            // Keep the label contents centered within the button, regardless of team name length.
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, LayoutAdaptation.value(compact: 8, pad: 12))
        }
        .buttonStyle(.borderedProminent)
        .tint(tintColor)
    }
}
