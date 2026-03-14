import SwiftUI

struct BackgroundView: View {
    private let base = Color(hex: "140A24")
    
    var body: some View {
        LinearGradient(
            colors: [base, base.opacity(0.92)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}
