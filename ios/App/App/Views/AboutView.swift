import SwiftUI

struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Family Guess Party Fun Time™")
                        .font(.title2)
                        .foregroundStyle(AppColors.pink)
                    Text("A fun party guessing game for the whole family! One player holds the phone to their forehead while others give verbal clues. Tilt forward when you guess correctly, or tilt backward to pass.")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.mutedText)
                    Text("© 2025 K Jasken and Associates, LLC. All rights reserved.")
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedText)
                    Text("Created by Keith Jasken.")
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedText)
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedText)
                    Text("This app is intended for fun, group play, and entertainment.")
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedText)
                    HStack(spacing: 16) {
                        NavigationLink(value: AppRoute.privacy) {
                            Text("Privacy Policy")
                                .font(.caption)
                                .foregroundStyle(AppColors.purple)
                                .underline()
                        }
                        NavigationLink(value: AppRoute.terms) {
                            Text("Terms of Use")
                                .font(.caption)
                                .foregroundStyle(AppColors.purple)
                                .underline()
                        }
                    }
                    .padding(.top, 8)
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(AppColors.pink.opacity(0.35), lineWidth: 1))
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button { dismiss() } label: { Image(systemName: "chevron.left") }
            }
            ToolbarItem(placement: .principal) {
                Text("About")
                    .font(.title2)
                    .foregroundStyle(AppColors.purple)
            }
        }
    }
}
