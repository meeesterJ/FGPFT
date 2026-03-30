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
        MulticoloredRoundText(fontSize: LayoutAdaptation.value(compact: 56, pad: 76))
    }
    
    private var multicoloredStudy: some View {
        MulticoloredStudyText(fontSize: LayoutAdaptation.value(compact: 32, pad: 44))
    }

    /// Non-study layout: places the `Round` + digit row and the `POINTS` row in one layout pass,
    /// so the points number can be centered under the header group while the `POINTS` label sits right of center.
    private struct RoundSummaryNonStudyLayout: Layout {
        var digitSpacing: CGFloat
        var pointsLabelSpacing: CGFloat
        private let headerToCompleteSpacing: CGFloat = 1 // Matches VStack(spacing: 1)
        private let completeToPointsSpacing: CGFloat = 2 // Matches outer VStack(spacing: 2)

        /// Aligns the last text baseline of "Round" and the round digit (same rule as `HStack(alignment: .lastTextBaseline)`).
        private func headerRowMetrics(
            wordSize: CGSize,
            digitSize: CGSize,
            dim0: ViewDimensions,
            dim1: ViewDimensions
        ) -> (height: CGFloat, wordY: CGFloat, digitY: CGFloat) {
            let b0 = dim0[VerticalAlignment.lastTextBaseline]
            let b1 = dim1[VerticalAlignment.lastTextBaseline]
            if b0 > 0, b1 > 0 {
                let maxB = max(b0, b1)
                let wordY = maxB - b0
                let digitY = maxB - b1
                let height = max(wordY + wordSize.height, digitY + digitSize.height)
                return (height, wordY, digitY)
            }
            let height = max(wordSize.height, digitSize.height)
            let wordY = (height - wordSize.height) / 2
            let digitY = (height - digitSize.height) / 2
            return (height, wordY, digitY)
        }

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

            let wordProposal = ProposedViewSize(width: roundWord.width, height: roundWord.height)
            let digitProposal = ProposedViewSize(width: roundDigit.width, height: roundDigit.height)
            let dim0 = subviews[0].dimensions(in: wordProposal)
            let dim1 = subviews[1].dimensions(in: digitProposal)
            let headerMetrics = headerRowMetrics(wordSize: roundWord, digitSize: roundDigit, dim0: dim0, dim1: dim1)

            let headerWidth = roundWord.width + digitSpacing + roundDigit.width
            let pointsRowWidth = pointsNumber.width + pointsLabelSpacing + pointsLabel.width

            let width = max(headerWidth, pointsRowWidth, complete.width)
            let height = headerMetrics.height + headerToCompleteSpacing + complete.height + completeToPointsSpacing + max(pointsNumber.height, pointsLabel.height)

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

            let wordProposal = ProposedViewSize(width: roundWordSize.width, height: roundWordSize.height)
            let digitProposal = ProposedViewSize(width: roundDigitSize.width, height: roundDigitSize.height)
            let dim0 = subviews[0].dimensions(in: wordProposal)
            let dim1 = subviews[1].dimensions(in: digitProposal)
            let headerMetrics = headerRowMetrics(wordSize: roundWordSize, digitSize: roundDigitSize, dim0: dim0, dim1: dim1)
            let headerHeight = headerMetrics.height

            let completeX = bounds.minX + (bounds.width - completeSize.width) / 2

            // Center the full "Round" + digit group on the column so it lines up with the score and button.
            let headerWidth = roundWordSize.width + digitSpacing + roundDigitSize.width
            let headerLeftX = bounds.midX - headerWidth / 2
            let roundWordLeftX = headerLeftX
            let roundDigitLeftX = headerLeftX + roundWordSize.width + digitSpacing

            let headerTopY = bounds.minY
            let roundWordY = headerTopY + headerMetrics.wordY
            let roundDigitY = headerTopY + headerMetrics.digitY

            // Place header row.
            subviews[0].place(
                at: CGPoint(x: roundWordLeftX, y: roundWordY),
                proposal: wordProposal
            )
            subviews[1].place(
                at: CGPoint(x: roundDigitLeftX, y: roundDigitY),
                proposal: digitProposal
            )

            // Place "COMPLETE" below the header row.
            let completeY = headerTopY + headerHeight + headerToCompleteSpacing
            subviews[2].place(
                at: CGPoint(x: completeX, y: completeY),
                proposal: ProposedViewSize(width: completeSize.width, height: completeSize.height)
            )

            // Place points row so the points number center matches the column center (same as the header group).
            let columnCenterX = bounds.midX
            let pointsRowTopY = completeY + completeSize.height + completeToPointsSpacing
            let pointsRowHeight = max(pointsNumberSize.height, pointsLabelSize.height)

            let pointsNumberY = pointsRowTopY + (pointsRowHeight - pointsNumberSize.height) / 2
            let pointsNumberLeftX = columnCenterX - pointsNumberSize.width / 2

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
        var pointsLabelSpacing: CGFloat
        private let headerToCompleteSpacing: CGFloat = 1 // VStack(spacing: 1)
        private let completeToPointsSpacing: CGFloat = 2 // Outer VStack(spacing: 2)

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
                    HStack(alignment: .top, spacing: LayoutAdaptation.value(compact: 24, pad: 32)) {
                        leftColumn
                        rightColumn
                    }
                    .padding(.horizontal, LayoutAdaptation.value(compact: 32, pad: 44))
                    .padding(.top, geo.safeAreaInsets.top + LayoutAdaptation.value(compact: 40, pad: 52))
                    .padding(.bottom, geo.safeAreaInsets.bottom + LayoutAdaptation.value(compact: 40, pad: 52))
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
                RoundSummaryStudyLayout(
                    pointsLabelSpacing: LayoutAdaptation.value(compact: 12, pad: 16)
                ) {
                    multicoloredStudy
                    
                    Text("COMPLETE")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 12, pad: 16)))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                    
                    Text("\(pointsThisRound)")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 96, pad: 120)))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("POINTS")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 12, pad: 16)))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                }
            } else {
                RoundSummaryNonStudyLayout(
                    digitSpacing: LayoutAdaptation.value(compact: 16, pad: 22),
                    pointsLabelSpacing: LayoutAdaptation.value(compact: 12, pad: 16)
                ) {
                    multicoloredRound
                    
                    Text("\(store.currentRound)")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 96, pad: 120)))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("COMPLETE")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 14, pad: 18)))
                        .fontWeight(.medium)
                        .foregroundStyle(AppColors.mutedText)
                        .tracking(2)
                    
                    Text("\(pointsThisRound)")
                        .font(AppFonts.display(size: LayoutAdaptation.value(compact: 96, pad: 120)))
                        .foregroundStyle(AppColors.yellow)
                    
                    Text("POINTS")
                        .font(AppFonts.body(size: LayoutAdaptation.value(compact: 14, pad: 18)))
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
        .frame(minHeight: LayoutAdaptation.value(compact: 56, pad: 68))
    }
    
    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: LayoutAdaptation.value(compact: 12, pad: 16)) {
            Text("Word History")
                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 18, pad: 24)))
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .padding(.top, LayoutAdaptation.value(compact: 12, pad: 16))
            
            ScrollView {
                VStack(spacing: LayoutAdaptation.value(compact: 8, pad: 12)) {
                    ForEach(Array(wordResults.enumerated()), id: \.offset) { _, result in
                        HStack {
                            Text(result.word)
                                .font(AppFonts.body(size: LayoutAdaptation.value(compact: 16, pad: 22)))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: result.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(result.correct ? AppColors.green : AppColors.pink)
                                .font(AppFonts.sfSymbol(size: LayoutAdaptation.value(compact: 20, pad: 26)))
                        }
                        .padding(.horizontal, LayoutAdaptation.value(compact: 16, pad: 22))
                        .padding(.vertical, LayoutAdaptation.value(compact: 10, pad: 14))
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 8, pad: 12)))
                    }
                }
            }
            .frame(maxHeight: .infinity)
        }
        .frame(maxWidth: .infinity)
        .padding(LayoutAdaptation.value(compact: 16, pad: 22))
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 16, pad: 20)))
        .overlay(
            RoundedRectangle(cornerRadius: LayoutAdaptation.value(compact: 16, pad: 20))
                .stroke(AppColors.purple.opacity(0.3), lineWidth: 1)
        )
    }
    
    private func bottomButton(expanded: Bool) -> some View {
        let labelSize: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        let symbolSize: CGFloat = LayoutAdaptation.value(compact: 14, pad: 18)
        let maxBtnWidth: CGFloat = LayoutAdaptation.value(compact: 160, pad: 220)
        return Button {
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
                        .font(AppFonts.sfSymbol(size: symbolSize))
                    Text("Get Smarter?")
                        .font(AppFonts.body(size: labelSize))
                        .fontWeight(.semibold)
                } else if store.willGameBeFinished {
                    Image(systemName: "trophy.fill")
                        .font(AppFonts.sfSymbol(size: symbolSize))
                    Text("See Winner!")
                        .font(AppFonts.body(size: labelSize))
                        .fontWeight(.semibold)
                } else {
                    Image(systemName: "list.number")
                        .font(AppFonts.sfSymbol(size: symbolSize))
                    Text("Scoreboard")
                        .font(AppFonts.body(size: labelSize))
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: expanded ? .infinity : maxBtnWidth)
            .minimumScaleFactor(0.85)
            .lineLimit(1)
            .padding(.vertical, LayoutAdaptation.value(compact: 8, pad: 12))
        }
        .buttonStyle(.borderedProminent)
        .tint(AppColors.pink)
    }
}
