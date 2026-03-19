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
        // Slightly smaller than the round number so the number reads as "bigger than Round".
        MulticoloredRoundText(fontSize: 56)
    }
    
    private var multicoloredStudy: some View {
        MulticoloredStudyText(fontSize: 32)
    }

    /// Non-study layout: places the `Round` + digit row and the `POINTS` row in one layout pass,
    /// so the points number can be centered under the digit while the `POINTS` label sits right of center.
    private struct RoundSummaryNonStudyLayout: Layout {
        private let digitSpacing: CGFloat = 16  // Matches the existing HStack(spacing: 16)
        private let headerToCompleteSpacing: CGFloat = 1 // Matches VStack(spacing: 1)
        private let completeToPointsSpacing: CGFloat = 2 // Matches outer VStack(spacing: 2)
        private let pointsLabelSpacing: CGFloat = 12

        func sizeThatFits(
            proposal: ProposedViewSize,
            subviews: Subviews,
            cache: inout Void
        ) -> CGSize {
            guard subviews.count >= 5 else { return .zero }

            let roundWord = subviews[0].sizeThatFits(.unspecified)
            let roundDigit = subviews[1].sizeThatFits(.unspecified)
            let complete = subviews[2].sizeThatFits(.unspecified)
            let pointsNumber = subviews[3].sizeThatFits(.unspecified)
            let pointsLabel = subviews[4].sizeThatFits(.unspecified)

            // Center vertically within the header row; the `baselineOffset` on the digit
            // handles the fine-tuning for the "1" visual alignment.
            let headerHeight = max(roundWord.height, roundDigit.height)

            let headerWidth = roundWord.width + digitSpacing + roundDigit.width
            let pointsRowWidth = pointsNumber.width + pointsLabelSpacing + pointsLabel.width

            let width = max(headerWidth, pointsRowWidth, complete.width)
            let height = headerHeight + headerToCompleteSpacing + complete.height + completeToPointsSpacing + max(pointsNumber.height, pointsLabel.height)

            let proposedWidth = proposal.width ?? width
            return CGSize(width: proposedWidth, height: height)
        }

        func placeSubviews(
            in bounds: CGRect,
            proposal: ProposedViewSize,
            subviews: Subviews,
            cache: inout Void
        ) {
            guard subviews.count >= 5 else { return }

            let roundWordSize = subviews[0].sizeThatFits(.unspecified)
            let roundDigitSize = subviews[1].sizeThatFits(.unspecified)
            let completeSize = subviews[2].sizeThatFits(.unspecified)
            let pointsNumberSize = subviews[3].sizeThatFits(.unspecified)
            let pointsLabelSize = subviews[4].sizeThatFits(.unspecified)

            let headerHeight = max(roundWordSize.height, roundDigitSize.height)

            let pointsRowWidth = pointsNumberSize.width + pointsLabelSpacing + pointsLabelSize.width

            let completeX = bounds.minX + (bounds.width - completeSize.width) / 2

            // X center of the digit (and therefore the points number) should be the container center,
            // so the score aligns with the centered button below.
            let digitCenterX = bounds.minX + bounds.width / 2
            let roundDigitLeftX = digitCenterX - roundDigitSize.width / 2
            let roundWordLeftX = roundDigitLeftX - digitSpacing - roundWordSize.width

            let headerTopY = bounds.minY
            let roundWordY = headerTopY + (headerHeight - roundWordSize.height) / 2
            let roundDigitY = headerTopY + (headerHeight - roundDigitSize.height) / 2

            // Place header row.
            subviews[0].place(
                at: CGPoint(x: roundWordLeftX, y: roundWordY),
                proposal: ProposedViewSize(width: roundWordSize.width, height: roundWordSize.height)
            )
            subviews[1].place(
                at: CGPoint(x: roundDigitLeftX, y: roundDigitY),
                proposal: ProposedViewSize(width: roundDigitSize.width, height: roundDigitSize.height)
            )

            // Place "COMPLETE" below the header row.
            let completeY = headerTopY + headerHeight + headerToCompleteSpacing
            subviews[2].place(
                at: CGPoint(x: completeX, y: completeY),
                proposal: ProposedViewSize(width: completeSize.width, height: completeSize.height)
            )

            // Place points row so the points number center matches digit center.
            let pointsRowTopY = completeY + completeSize.height + completeToPointsSpacing
            let pointsRowHeight = max(pointsNumberSize.height, pointsLabelSize.height)

            let pointsNumberY = pointsRowTopY + (pointsRowHeight - pointsNumberSize.height) / 2
            let pointsNumberLeftX = digitCenterX - pointsNumberSize.width / 2

            subviews[3].place(
                at: CGPoint(x: pointsNumberLeftX, y: pointsNumberY),
                proposal: ProposedViewSize(width: pointsNumberSize.width, height: pointsNumberSize.height)
            )

            let pointsLabelY = pointsRowTopY + (pointsRowHeight - pointsLabelSize.height) / 2
            let pointsLabelLeftX = pointsNumberLeftX + pointsNumberSize.width + pointsLabelSpacing

            subviews[4].place(
                at: CGPoint(x: pointsLabelLeftX, y: pointsLabelY),
                proposal: ProposedViewSize(width: pointsLabelSize.width, height: pointsLabelSize.height)
            )
        }
    }

    /// Study mode layout: no "Round n" digit, so we center the points number within the layout
    /// and place `POINTS` to the right of it.
    private struct RoundSummaryStudyLayout: Layout {
        private let headerToCompleteSpacing: CGFloat = 1 // VStack(spacing: 1)
        private let completeToPointsSpacing: CGFloat = 2 // Outer VStack(spacing: 2)
        private let pointsLabelSpacing: CGFloat = 12

        func sizeThatFits(
            proposal: ProposedViewSize,
            subviews: Subviews,
            cache: inout Void
        ) -> CGSize {
            guard subviews.count >= 4 else { return .zero }

            let study = subviews[0].sizeThatFits(.unspecified)
            let complete = subviews[1].sizeThatFits(.unspecified)
            let pointsNumber = subviews[2].sizeThatFits(.unspecified)
            let pointsLabel = subviews[3].sizeThatFits(.unspecified)

            let headerWidth = max(study.width, complete.width)
            let pointsRowWidth = pointsNumber.width + pointsLabelSpacing + pointsLabel.width
            let width = max(headerWidth, pointsRowWidth)

            let headerHeight = study.height + headerToCompleteSpacing + complete.height
            let pointsRowHeight = max(pointsNumber.height, pointsLabel.height)
            let height = headerHeight + completeToPointsSpacing + pointsRowHeight

            let proposedWidth = proposal.width ?? width
            return CGSize(width: proposedWidth, height: height)
        }

        func placeSubviews(
            in bounds: CGRect,
            proposal: ProposedViewSize,
            subviews: Subviews,
            cache: inout Void
        ) {
            guard subviews.count >= 4 else { return }

            let studySize = subviews[0].sizeThatFits(.unspecified)
            let completeSize = subviews[1].sizeThatFits(.unspecified)
            let pointsNumberSize = subviews[2].sizeThatFits(.unspecified)
            let pointsLabelSize = subviews[3].sizeThatFits(.unspecified)

            let headerTopY = bounds.minY
            let studyX = bounds.minX + (bounds.width - studySize.width) / 2
            subviews[0].place(
                at: CGPoint(x: studyX, y: headerTopY),
                proposal: ProposedViewSize(width: studySize.width, height: studySize.height)
            )

            let completeY = headerTopY + studySize.height + headerToCompleteSpacing
            let completeX = bounds.minX + (bounds.width - completeSize.width) / 2
            subviews[1].place(
                at: CGPoint(x: completeX, y: completeY),
                proposal: ProposedViewSize(width: completeSize.width, height: completeSize.height)
            )

            let pointsRowTopY = completeY + completeSize.height + completeToPointsSpacing
            let pointsRowHeight = max(pointsNumberSize.height, pointsLabelSize.height)

            let pointsNumberY = pointsRowTopY + (pointsRowHeight - pointsNumberSize.height) / 2
            let digitCenterX = bounds.minX + bounds.width / 2
            let pointsNumberLeftX = digitCenterX - pointsNumberSize.width / 2

            subviews[2].place(
                at: CGPoint(x: pointsNumberLeftX, y: pointsNumberY),
                proposal: ProposedViewSize(width: pointsNumberSize.width, height: pointsNumberSize.height)
            )

            let pointsLabelY = pointsRowTopY + (pointsRowHeight - pointsLabelSize.height) / 2
            let pointsLabelLeftX = pointsNumberLeftX + pointsNumberSize.width + pointsLabelSpacing

            subviews[3].place(
                at: CGPoint(x: pointsLabelLeftX, y: pointsLabelY),
                proposal: ProposedViewSize(width: pointsLabelSize.width, height: pointsLabelSize.height)
            )
        }
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
                    .padding(.bottom, geo.safeAreaInsets.bottom + 40)
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
        return VStack(spacing: 2) {
            Spacer()
            
            if store.studyMode {
                RoundSummaryStudyLayout {
                    multicoloredStudy
                    
                    Text("COMPLETE")
                        .font(AppFonts.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                    
                    Text("\(pointsThisRound)")
                        .font(AppFonts.display(size: 96))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("POINTS")
                        .font(AppFonts.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                }
            } else {
                RoundSummaryNonStudyLayout {
                    multicoloredRound
                        .frame(height: 96)
                    
                    Text("\(store.currentRound)")
                        .font(AppFonts.display(size: 96))
                        .baselineOffset(store.currentRound == 1 ? -6 : 0)
                        .frame(height: 96)
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("COMPLETE")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                    
                    Text("\(pointsThisRound)")
                        .font(AppFonts.display(size: 96))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("POINTS")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                }
            }
            
            bottomButtonRow
            
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
    
    /// Button-only adaptive row (keeps the small-width behavior without the "Points this round" label).
    private var bottomButtonRow: some View {
        GeometryReader { rowGeo in
            let narrow = rowGeo.size.width < 320
            bottomButton(expanded: narrow)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .frame(minHeight: 56)
    }
    
    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Word History")
                .font(AppFonts.body(size: 18))
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .padding(.top, 12)
            
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
                                .font(AppFonts.sfSymbol(size: 20))
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
    
    private func bottomButton(expanded: Bool) -> some View {
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
                        .font(AppFonts.sfSymbol(size: 14))
                    Text("Get Smarter?")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                } else if store.willGameBeFinished {
                    Image(systemName: "trophy.fill")
                        .font(AppFonts.sfSymbol(size: 14))
                    Text("See Winner!")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                } else {
                    Image(systemName: "list.number")
                        .font(AppFonts.sfSymbol(size: 14))
                    Text("Scoreboard")
                        .font(AppFonts.body(size: 14))
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: expanded ? .infinity : 160)
            .minimumScaleFactor(0.85)
            .lineLimit(1)
            .padding(.vertical, 8)
        }
        .buttonStyle(.borderedProminent)
        .tint(AppColors.pink)
    }
}
