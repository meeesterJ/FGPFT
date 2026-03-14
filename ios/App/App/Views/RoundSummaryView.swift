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
        HStack(spacing: 0) {
            Text("R").foregroundStyle(AppColors.cyan)
            Text("o").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("n").foregroundStyle(AppColors.green)
            Text("d").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: 48))
    }
    
    private var multicoloredStudy: some View {
        HStack(spacing: 0) {
            Text("S").foregroundStyle(AppColors.cyan)
            Text("t").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("d").foregroundStyle(AppColors.green)
            Text("y").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: 72))
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
                    
                    Spacer()
                    
                    bottomButton
                        .padding(.bottom, 32)
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
        VStack(spacing: 8) {
            Spacer()
            
            if store.studyMode {
                multicoloredStudy
                
                Text("COMPLETE")
                    .font(AppFonts.body(size: 14))
                    .fontWeight(.medium)
                    .foregroundStyle(AppColors.mutedText)
                    .tracking(3)
            } else {
                multicoloredRound
                
                Text("\(store.currentRound)")
                    .font(AppFonts.display(size: 72))
                    .foregroundStyle(AppColors.yellow)
                
                Text("COMPLETE")
                    .font(AppFonts.body(size: 14))
                    .fontWeight(.medium)
                    .foregroundStyle(AppColors.mutedText)
                    .tracking(3)
            }
            
            Spacer()
                .frame(height: 16)
            
            Text("\(pointsThisRound)")
                .font(AppFonts.display(size: 80))
                .foregroundStyle(AppColors.yellow)
            
            Text("Points this round")
                .font(AppFonts.body(size: 16))
                .foregroundStyle(AppColors.mutedText)
            
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
            HStack(spacing: 8) {
                if store.studyMode {
                    Image(systemName: "brain.head.profile")
                    Text("Get Smarter?")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                } else if store.willGameBeFinished {
                    Image(systemName: "trophy.fill")
                    Text("See Winner!")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                } else {
                    Image(systemName: "list.number")
                    Text("Scoreboard")
                        .font(AppFonts.body(size: 20))
                        .fontWeight(.bold)
                }
            }
            .frame(maxWidth: 240)
            .padding(.vertical, 12)
        }
        .buttonStyle(.borderedProminent)
        .tint(AppColors.pink)
    }
}
