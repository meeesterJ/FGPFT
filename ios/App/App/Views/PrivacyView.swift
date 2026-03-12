import SwiftUI

struct PrivacyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Last updated: February 2026")
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedText)
                
                section("Introduction", color: AppColors.pink) {
                    Text("Family Guess Party Fun Time™ (\"the App\") is developed and operated by K Jasken and Associates, LLC (\"we,\" \"us,\" or \"our\"). This Privacy Policy explains how we handle information when you use our App.")
                }
                section("Information We Collect", color: AppColors.cyan) {
                    Text("We do not collect personal information. The App is designed to be used locally on your device without requiring account creation, login, or data transmission to external servers.")
                    Text("All game settings, custom word lists, and preferences are stored locally on your device. This data never leaves your device and is not accessible to us.")
                }
                section("Device Permissions", color: AppColors.yellow) {
                    Text("The App may request access to:")
                    Text("• Device motion (orientation) — Used for tilt-based gesture controls during gameplay")
                    Text("• Vibration — Used for haptic feedback (optional, can be disabled in Settings)")
                    Text("• Audio — Used for sound effects during gameplay (optional, can be disabled in Settings)")
                    Text("These permissions are used solely for gameplay functionality and do not transmit any data externally.")
                }
                section("Third-Party Services", color: AppColors.green) {
                    Text("The App does not integrate with third-party analytics, advertising networks, or data collection services. We do not share any information with third parties.")
                }
                section("Children's Privacy", color: AppColors.purple) {
                    Text("The App is designed for family entertainment and is suitable for all ages. We do not knowingly collect any personal information from children or any users.")
                }
                section("Data Security", color: AppColors.pink) {
                    Text("Since all data is stored locally on your device, the security of your data depends on your device's security settings. We recommend using device passcodes and keeping your device software updated.")
                }
                section("Changes to This Policy", color: AppColors.cyan) {
                    Text("We may update this Privacy Policy from time to time. Any changes will be reflected in the \"Last updated\" date at the top of this page.")
                }
                section("Contact Us", color: AppColors.yellow) {
                    Text("If you have questions about this Privacy Policy, please contact us at K Jasken and Associates, LLC: KJaskenAssoc@pm.me")
                }
                Text("© 2025 K Jasken and Associates, LLC. All rights reserved.")
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedText)
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barPurple, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Privacy Policy")
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
                .font(.subheadline)
                .foregroundStyle(AppColors.mutedText)
        }
    }
}
