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
                    bullet("1. Choose categories, time per round, and number of rounds in Settings, and start the game")
                    bullet("2. Hold your phone to your forehead in landscape mode")
                    bullet("3. Your friends give you clues without saying the word")
                    bullet("4. Tilt forward for correct, backward to pass")
                    bullet("5. Score as many points as you can before time runs out!")
                }
                section(title: "Categories", color: AppColors.green) {
                    bullet("Customize your own lists!")
                    bullet("Edit existing lists to add or remove words")
                    bullet("Add brand new lists with your own themes")
                    bullet("Add words one per line when creating or editing a list")
                }
                section(title: "Study Mode", color: AppColors.purple) {
                    bullet("Great for language learning, flashcards, and vocabulary practice")
                    bullet("Format: Word (helper text) [answer]")
                    bullet("Helper text and answers are optional — use what you need")
                    bullet("Helper text shows as a hint below the word, e.g. \"Hola (greeting)\"")
                    bullet("Answers in [brackets] are revealed with a tap, e.g. \"Hola [Hello]\"")
                    bullet("Tap the card to reveal the answer")
                    bullet("Tilt is off by default — use the on-screen buttons instead")
                    bullet("Set the timer to infinite for untimed study sessions")
                    bullet("Mark a category as Study Mode when creating or editing a list")
                }
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barYellow, for: .navigationBar)
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
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(AppColors.cyan.opacity(0.5), lineWidth: 1))
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
