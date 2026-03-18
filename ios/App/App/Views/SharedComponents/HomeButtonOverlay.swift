import SwiftUI

struct HomeButtonOverlay: View {
    let action: () -> Void
    
    var body: some View {
        GeometryReader { geo in
            VStack {
                HStack {
                    Button(action: action) {
                        Image(systemName: "house.fill")
                            .font(AppFonts.sfSymbol(size: 20))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.white.opacity(0.15))
                            .clipShape(Circle())
                    }
                    .padding(.leading, geo.safeAreaInsets.leading + 16)
                    .padding(.top, geo.safeAreaInsets.top + 16)
                    Spacer()
                }
                Spacer()
            }
        }
    }
}
