import SwiftUI

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Family Guess Party Fun Time™")
                        .font(AppFonts.display(size: 22))
                        .foregroundStyle(AppColors.pink)
                    Text("A fun party guessing game for the whole family! One player holds the phone to their forehead while others give verbal clues. Tilt forward when you guess correctly, or tilt backward to pass.")
                        .font(AppFonts.body(size: 15))
                        .foregroundStyle(AppColors.mutedText)
                    Text("© 2025 K Jasken and Associates, LLC. All rights reserved.")
                        .font(AppFonts.body(size: 12))
                        .foregroundStyle(AppColors.mutedText)
                    Text("Created by Keith Jasken.")
                        .font(AppFonts.body(size: 12))
                        .foregroundStyle(AppColors.mutedText)
                    Text("Version 1.0.0")
                        .font(AppFonts.body(size: 12))
                        .foregroundStyle(AppColors.mutedText)
                    Text("This app is intended for fun, group play, and entertainment.")
                        .font(AppFonts.body(size: 12))
                        .foregroundStyle(AppColors.mutedText)
                    HStack(spacing: 16) {
                        NavigationLink(value: AppRoute.privacy) {
                            Text("Privacy Policy")
                                .font(AppFonts.body(size: 12))
                                .foregroundStyle(AppColors.purple)
                                .underline()
                        }
                        NavigationLink(value: AppRoute.terms) {
                            Text("Terms of Use")
                                .font(AppFonts.body(size: 12))
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
        .transparentPurpleBottomBar()
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbarBackgroundVisibility(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("About")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.purple)
            }
        }
    }
}
