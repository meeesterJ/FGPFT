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
    }
}

struct SplashView: View {
    let onTap: () -> Void
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            TitleStackView(animated: true)
            Text("Tap anywhere to start")
                .font(AppFonts.body(size: 20))
                .foregroundStyle(.secondary)
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}

struct MainMenuView: View {
    @Binding var path: NavigationPath
    @EnvironmentObject var store: GameStore
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            TitleStackView(animated: false)
            Spacer()
            VStack(spacing: 12) {
                Button { path.append(AppRoute.game) } label: {
                    Label("Play Now", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                }
                .buttonStyle(MenuButtonStyle(color: .pink))
                Button { path.append(AppRoute.categories) } label: {
                    Label("Categories", systemImage: "list.bullet")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                }
                .buttonStyle(MenuButtonStyle(color: .cyan))
                Button { path.append(AppRoute.settings) } label: {
                    Label("Settings", systemImage: "gearshape")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                }
                .buttonStyle(MenuButtonStyle(color: .purple))
                Button { path.append(AppRoute.howToPlay) } label: {
                    Label("How to Play", systemImage: "questionmark.circle")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .font(AppFonts.body(size: 18))
                            .fontWeight(.bold)
                }
                .buttonStyle(MenuButtonStyle(color: .yellow))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
        .safeAreaInset(edge: .top) { Color.clear.frame(height: 0) }
    }
}

struct TitleStackView: View {
    let animated: Bool
    private let words: [(String, Color)] = [
        ("Family", .pink),
        ("Guess", Color(red: 0.13, green: 0.83, blue: 0.93)),
        ("Party", .yellow),
        ("Fun", .green),
        ("Time", .purple)
    ]
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(words.enumerated()), id: \.offset) { _, w in
                Text(w.0)
                    .foregroundStyle(w.1)
                    .font(AppFonts.display(size: 36))
            }
        }
        .rotationEffect(.degrees(-2))
    }
}

struct MenuButtonStyle: ButtonStyle {
    let color: Color
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct BackgroundView: View {
    /// Original web app: --background: 260 30% 12% (deep purple/black)
    private let base = Color(hex: "1e1a2e")
    
    var body: some View {
        LinearGradient(
            colors: [base, base.opacity(0.92)],
            startPoint: .top,
            endPoint: .bottom
        )
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
