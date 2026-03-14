import SwiftUI

enum AppFonts {
    static func display(size: CGFloat) -> Font { .custom("Titan One", size: size) }
    static func body(size: CGFloat) -> Font { .custom("Outfit", size: size) }
}

enum AppColors {
    static let pink = Color(hex: "f472b6")
    static let cyan = Color(red: 0.13, green: 0.83, blue: 0.93)
    static let purple = Color(red: 0.65, green: 0.55, blue: 0.98)
    static let green = Color(red: 0.29, green: 0.87, blue: 0.5)
    static let yellow = Color(red: 0.98, green: 0.8, blue: 0.09)
    static let destructive = Color(hex: "e84a6f")
    static let mutedText = Color.white.opacity(0.7)
    static let primaryPurple = Color(hex: "9333ea")
    static let barBackground = Color(hex: "140A24").opacity(0.92)
    static let inputBackground = Color(hex: "140A24")
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

extension TeamThemeColor {
    var color: Color {
        Color(hex: String(textHex.dropFirst()))
    }
}
