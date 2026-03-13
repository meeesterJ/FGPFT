import SwiftUI

/// Fonts matching the web app: Titan One (display/titles), Outfit (body).
enum AppFonts {
    static func display(size: CGFloat) -> Font { .custom("Titan One", size: size) }
    static func body(size: CGFloat) -> Font { .custom("Outfit", size: size) }
}

struct HomeView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    @State private var showSplash = true
    
    var body: some View {
        Group {
            if showSplash {
                SplashView { showSplash = false }
            } else {
                MainMenuView(path: $path)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(BackgroundView())
        .ignoresSafeArea()
        .onAppear { OrientationManager.shared.supportedOrientations = .allButUpsideDown }
    }
}

struct SplashView: View {
    let onTap: () -> Void
    
    var body: some View {
        GeometryReader { geo in
            let titleHeight = geo.size.height * 0.72 * 0.9  // 90% of previous size
            VStack(spacing: 24) {
                Spacer()
                TitleStackView(animated: true, availableHeight: titleHeight)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                Text("Tap anywhere to start")
                    .font(AppFonts.body(size: 20))
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}

struct MainMenuView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    
    private var menuButtons: some View {
        VStack(spacing: 12) {
            Button { path.append(AppRoute.game) } label: {
                Label("Play Now", systemImage: "play.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .font(AppFonts.body(size: 18))
                    .fontWeight(.bold)
            }
            .buttonStyle(MenuButtonStyle(backgroundColor: Color(hex: "ec4899"), borderColor: Color(hex: "f472b6")))
            Button { path.append(AppRoute.categories) } label: {
                Label("Categories", systemImage: "list.bullet")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .font(AppFonts.body(size: 18))
                    .fontWeight(.bold)
            }
            .buttonStyle(MenuButtonStyle(backgroundColor: Color(hex: "0891b2"), borderColor: Color(hex: "22d3ee")))
            Button { path.append(AppRoute.settings) } label: {
                Label("Settings", systemImage: "gearshape")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .font(AppFonts.body(size: 18))
                    .fontWeight(.bold)
            }
            .buttonStyle(MenuButtonStyle(backgroundColor: Color(hex: "9333ea"), borderColor: Color(hex: "a78bfa")))
            Button { path.append(AppRoute.howToPlay) } label: {
                Label("How to Play", systemImage: "questionmark.circle")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .font(AppFonts.body(size: 18))
                    .fontWeight(.bold)
            }
            .buttonStyle(MenuButtonStyle(backgroundColor: Color(hex: "ca8a04"), borderColor: Color(hex: "facc15")))
        }
    }
    
    var body: some View {
        GeometryReader { geo in
            let isLandscape = geo.size.width > geo.size.height
            let edgePadding: CGFloat = 24
            let safeW = max(0, geo.size.width - edgePadding * 2)
            let safeH = max(0, geo.size.height - edgePadding * 2)
            
            if isLandscape {
                // Landscape: title left, buttons stacked right; fill screen with padding
                HStack(alignment: .center, spacing: edgePadding) {
                    // Title on the left – use most of left half height for font scaling
                    let titleAreaHeight = safeH
                    TitleStackView(animated: false, availableHeight: titleAreaHeight * 0.85)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    // Buttons stacked on the right with a sensible max width
                    menuButtons
                        .frame(maxWidth: min(280, safeW * 0.45), maxHeight: .infinity)
                        .padding(.leading, edgePadding)
                }
                .padding(edgePadding)
            } else {
                // Portrait: existing vertical layout
                let titleHeight = geo.size.height * 0.44
                VStack(spacing: 0) {
                    Spacer(minLength: 36)
                    TitleStackView(animated: false, availableHeight: titleHeight)
                        .frame(maxWidth: .infinity)
                        .frame(height: titleHeight)
                    Spacer(minLength: 20)
                    menuButtons
                        .padding(.horizontal, edgePadding)
                        .padding(.bottom, 24)
                }
                .padding(.top, 28)
                .padding(.bottom, 36)
            }
        }
        .safeAreaInset(edge: .top) { Color.clear.frame(height: 0) }
    }
}

/// Title word colors matching web app game-ui: text-pink-400, text-cyan-400, etc.
private let titleWordColors: [(String, Color)] = [
    ("Family", Color(hex: "f472b6")),   // pink-400
    ("Guess", Color(hex: "22d3ee")),    // cyan-400
    ("Party", Color(hex: "facc15")),    // yellow-400
    ("Fun", Color(hex: "4ade80")),      // green-400
    ("Time", Color(hex: "a78bfa")),      // purple-400
]

struct TitleStackView: View {
    let animated: Bool
    /// When set, font and spacing scale so the title uses most of this height.
    var availableHeight: CGFloat? = nil
    
    @State private var dropInTrigger = false
    
    private var fontSize: CGFloat {
        guard let h = availableHeight, h > 0 else { return 64 }
        // Scale so 5 lines + spacing roughly fill the red box (availableHeight)
        return min(120, max(40, h / 5.4))
    }
    private var lineSpacing: CGFloat {
        guard let h = availableHeight, h > 0 else { return 12 }
        return max(6, h / 24)
    }
    
    var body: some View {
        VStack(alignment: .center, spacing: lineSpacing) {
            ForEach(Array(titleWordColors.enumerated()), id: \.offset) { index, w in
                Text(w.0)
                    .foregroundStyle(w.1)
                    .font(AppFonts.display(size: fontSize))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
                    .opacity(animated ? (dropInTrigger ? 1 : 0) : 1)
                    .offset(y: animated ? (dropInTrigger ? 0 : -90) : 0)
                    .animation(
                        animated ? .spring(response: 0.6, dampingFraction: 0.62)
                            .delay(Double(index) * 0.16) : .default,
                        value: dropInTrigger
                    )
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .rotationEffect(.degrees(-2), anchor: .center)
        .onAppear {
            guard animated else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
                dropInTrigger = true
            }
        }
    }
}

/// Button colors match web app menuButtonStyles: bg-*-500/600, border-*-400.
struct MenuButtonStyle: ButtonStyle {
    let backgroundColor: Color
    let borderColor: Color
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .background(backgroundColor)
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(borderColor, lineWidth: 2))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct BackgroundView: View {
    /// Sampled from Quick Start art: dark purplish-blue = #140A24
    private let base = Color(hex: "140A24")
    
    var body: some View {
        LinearGradient(
            colors: [base, base.opacity(0.92)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea(edges: .bottom)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
