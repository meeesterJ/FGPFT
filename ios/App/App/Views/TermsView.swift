import SwiftUI

struct TermsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Last updated: February 2026")
                    .font(AppFonts.body(size: 12))
                    .foregroundStyle(AppColors.mutedText)
                
                section("Agreement to Terms", color: AppColors.pink) {
                    Text("By accessing or using Family Guess Party Fun Time™ (\"the App\"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.")
                }
                section("License to Use", color: AppColors.cyan) {
                    Text("K Jasken and Associates, LLC grants you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial entertainment purposes.")
                    Text("You may not: Copy, modify, or distribute the App or its content; reverse engineer or attempt to extract the source code; use the App for any commercial purpose without authorization; remove any copyright or proprietary notices.")
                }
                section("User Content", color: AppColors.yellow) {
                    Text("The App allows you to create custom word lists. You are solely responsible for any content you create. You agree not to create content that is offensive, harmful, or violates any laws.")
                }
                section("Intellectual Property", color: AppColors.green) {
                    Text("Family Guess Party Fun Time™ and all associated trademarks, logos, and content are the property of K Jasken and Associates, LLC. All rights reserved.")
                    Text("The built-in word lists and game mechanics are protected by copyright. Unauthorized reproduction or distribution is prohibited.")
                }
                section("Disclaimer of Warranties", color: AppColors.purple) {
                    Text("THE APP IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.")
                }
                section("Limitation of Liability", color: AppColors.pink) {
                    Text("TO THE MAXIMUM EXTENT PERMITTED BY LAW, K JASKEN AND ASSOCIATES, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.")
                }
                section("Intended Use", color: AppColors.cyan) {
                    Text("This App is intended for fun, group play, and entertainment purposes only. Please play responsibly and be mindful of your surroundings when using device motion features.")
                }
                section("Changes to Terms", color: AppColors.yellow) {
                    Text("We reserve the right to modify these Terms of Use at any time. Continued use of the App after changes constitutes acceptance of the modified terms.")
                }
                section("Governing Law", color: AppColors.green) {
                    Text("These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.")
                }
                section("Contact Us", color: AppColors.purple) {
                    Text("If you have questions about these Terms of Use, please contact us at K Jasken and Associates, LLC: KJaskenAssoc@pm.me")
                }
                Text("© 2025 K Jasken and Associates, LLC. All rights reserved.")
                    .font(AppFonts.body(size: 12))
                    .foregroundStyle(AppColors.mutedText)
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Terms of Use")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.purple)
            }
        }
    }
    
    private func section(_ title: String, color: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(color)
            content()
                .font(AppFonts.body(size: 15))
                .foregroundStyle(AppColors.mutedText)
        }
    }
}
