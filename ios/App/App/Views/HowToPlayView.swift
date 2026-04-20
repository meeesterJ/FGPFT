import SwiftUI

struct HowToPlayView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                quickStartImage
                section(title: "Getting Started", color: AppColors.pink) {
                    bullet("One player holds the phone to their forehead and guesses while others give clues (verbal, acting, drawing, impersonation, accents, etc)")
                    bullet("Clue givers may not say the word or part of the word")
                    bullet("Tilt forward when you guess correctly or tilt backward to pass")
                }
                section(title: "Tips", color: AppColors.yellow) {
                    bullet("Don't say the word or any part of it")
                    bullet("Pass quickly if you're stuck to save time")
                    bullet("Take turns being the guesser")
                    bullet("Split into two teams and compete!")
                    bullet("Give creative clues - act it out, describe it, use rhymes!")
                    bullet("Use accents or impersonation or act out clues")
                    bullet("House rules are highly encouraged!")
                    bullet("Edit lists or create your own custom lists")
                }
                section(title: "Step by Step", color: AppColors.cyan) {
                    bullet("Choose categories, time per round, and number of rounds in Settings, and start the game")
                    bullet("Hold your phone to your forehead in landscape mode")
                    bullet("Your friends give you clues without saying the word")
                    bullet("Tilt forward for correct, backward to pass")
                    bullet("Score as many points as you can before time runs out!")
                }
                section(title: "Categories", color: AppColors.green) {
                    bullet("Customize your own lists!")
                    bullet("Edit existing lists to add or remove words")
                    bullet("Add brand new lists with your own themes")
                    bullet("Add words one per line when creating or editing a list")
                    bullet("Swipe right to favorite or unfavorite a list")
                    bullet("Swipe left to delete (restore from Deleted Categories if needed)")
                    bullet("Gold Sort cycles order; book toggles game vs Study lists")
                    bullet("Give me a list of [#] words that would be fun for the family to guess in the category of [category]. Output must be a line separated list.")
                }
                section(title: "Study Mode", color: AppColors.purple) {
                    bullet("Great for language learning, flashcards, and vocabulary practice")
                    bullet("Format: Word [answer]")
                    bullet("Answers are optional — use what you need")
                    bullet("Answers in [brackets] are revealed with a tap, e.g. \"Hola [Hello]\"")
                    bullet("Tap the card to reveal the answer")
                    bullet("Tilt is off by default — use the on-screen buttons instead")
                    bullet("Set the timer to infinite for untimed study sessions")
                    bullet("Mark a category as Study Mode when creating or editing a list")
                    bullet("Give me a list of [#] words and answers that would be fun for the family to guess in the category of [category]. Output must be a line separated list in the following format: word[answer]")
                }
            }
            .padding(.vertical, 20)
            .padding(.horizontal, LayoutAdaptation.contentMargin(compact: 16, pad: 0))
            .padding(.bottom, 40)
        }
        .transparentPurpleBottomBar()
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("How to Play")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.yellow)
            }
        }
    }
    
    private var quickStartImage: some View {
        Image("QuickStartHowTo")
            .resizable()
            .scaledToFit()
            .padding(.horizontal, 4)
    }
    
    private func section<Content: View>(title: String, color: Color, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(AppFonts.display(size: 24))
                .foregroundStyle(color)
            content()
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(color.opacity(0.35), lineWidth: 1))
    }
    
    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
                .font(AppFonts.body(size: 17))
                .foregroundStyle(AppColors.mutedText)
            Text(text)
                .font(AppFonts.body(size: 17))
                .foregroundStyle(AppColors.mutedText)
        }
    }
}

