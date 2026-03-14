import SwiftUI

struct RoundSummaryView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    
    private var teamIndex: Int { store.currentTeam - 1 }
    
    private var pointsThisRound: Int {
        guard teamIndex >= 0 && teamIndex < store.teamRoundScores.count else { return 0 }
        return store.teamRoundScores[teamIndex].correct
    }
    
    private var wordResults: [(word: String, correct: Bool)] {
        guard teamIndex >= 0 && teamIndex < store.teamRoundResults.count else { return [] }
        return store.teamRoundResults[teamIndex]
    }
    
    private var multicoloredRound: some View {
        MulticoloredRoundText(fontSize: 32)
    }
    
    private var multicoloredStudy: some View {
        MulticoloredStudyText(fontSize: 32)
    }
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                BackgroundView()
                
                VStack(spacing: 0) {
                    HStack(alignment: .top, spacing: 24) {
                        leftColumn
                        rightColumn
                    }
                    .padding(.horizontal, 32)
                    .padding(.top, geo.safeAreaInsets.top + 40)
                }
                
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
    
    private var leftColumn: some View {
        VStack(spacing: 4) {
            Spacer()
            
            if store.studyMode {
                HStack(spacing: 8) {
                    multicoloredStudy
                    Text("COMPLETE")
                        .font(AppFonts.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                }
            } else {
                HStack(spacing: 8) {
                    multicoloredRound
                    Text("\(store.currentRound)")
                        .font(AppFonts.display(size: 40))
                        .foregroundStyle(AppColors.yellow)
                    Text("COMPLETE")
                        .font(AppFonts.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                }
            }
            
            Text("\(pointsThisRound)")
                .font(AppFonts.display(size: 96))
                .foregroundStyle(AppColors.yellow)
            
            Text("Points this round")
                .font(AppFonts.body(size: 14))
                .foregroundStyle(AppColors.mutedText)
            
            Spacer()
                .frame(height: 16)
            
            bottomButton
            
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
    
    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Word History")
                .font(AppFonts.body(size: 18))
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .padding(.top, 8)
            
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(Array(wordResults.enumerated()), id: \.offset) { _, result in
                        HStack {
                            Text(result.word)
                                .font(AppFonts.body(size: 16))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: result.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(result.correct ? AppColors.green : AppColors.pink)
                                .font(.system(size: 20))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .frame(maxHeight: .infinity)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(AppColors.purple.opacity(0.3), lineWidth: 1)
        )
    }
    
    private var bottomButton: some View {
        Button {
            if store.studyMode {
                store.startGame()
                path = NavigationPath()
                path.append(AppRoute.game)
            } else if store.willGameBeFinished {
                store.prepareRound()
                path.append(AppRoute.summary)
            } else {
                path.append(AppRoute.scoreboard)
            }
        } label: {
            HStack(spacing: 6) {
                if store.studyMode {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 14))
                    Text("Get Smarter?")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                } else if store.willGameBeFinished {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 14))
                    Text("See Winner!")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                } else {
                    Image(systemName: "list.number")
                        .font(.system(size: 14))
                    Text("Scoreboard")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: 160)
            .padding(.vertical, 8)
        }
        .buttonStyle(.borderedProminent)
        .tint(AppColors.pink)
    }
}
