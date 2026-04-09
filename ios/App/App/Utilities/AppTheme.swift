import SwiftUI
import UIKit

/// App typography: **Titan One** (`display`) and **Outfit** (`body`), with runtime resolution for bundled font names.
/// SF Symbols must use `sfSymbol(size:)` — that is the only intentional use of the system font for glyphs.
enum AppFonts {
    /// Resolves the bundled variable Outfit face (family "Outfit" or named instances).
    private static let outfitPostScriptName: String = {
        for name in ["Outfit", "Outfit-Thin_Regular", "Outfit-Regular"] {
            if UIFont(name: name, size: 12) != nil { return name }
        }
        return "Outfit"
    }()

    private static let titanPostScriptName: String = {
        for name in ["Titan One", "TitanOne-Regular"] {
            if UIFont(name: name, size: 12) != nil { return name }
        }
        return "Titan One"
    }()

    static func display(size: CGFloat) -> Font { .custom(titanPostScriptName, size: size) }
    static func body(size: CGFloat) -> Font { .custom(outfitPostScriptName, size: size) }

    /// Outfit at `baseSize` (default UIKit content size), scaled for Dynamic Type using `textStyle` metrics.
    static func body(baseSize: CGFloat, textStyle: UIFont.TextStyle) -> Font {
        let scaled = UIFontMetrics(forTextStyle: textStyle).scaledValue(for: baseSize)
        return .custom(outfitPostScriptName, size: scaled)
    }

    /// SF Symbols render with the system font; use only for `Image(systemName:)`.
    static func sfSymbol(size: CGFloat) -> Font { .system(size: size) }

    static func uiOutfit(size: CGFloat) -> UIFont {
        UIFont(name: outfitPostScriptName, size: size) ?? .systemFont(ofSize: size, weight: .regular)
    }

    /// Titan One for UIKit measurement (matches `display(size:)`).
    static func uiDisplay(size: CGFloat) -> UIFont {
        UIFont(name: titanPostScriptName, size: size) ?? .systemFont(ofSize: size, weight: .bold)
    }

    /// Widest bounding width among `words` at Titan One `fontSize`.
    static func maxDisplayWordWidth(words: [String], fontSize: CGFloat) -> CGFloat {
        let font = uiDisplay(size: fontSize)
        var widest: CGFloat = 0
        for word in words {
            let w = (word as NSString).size(withAttributes: [.font: font]).width
            widest = max(widest, w)
        }
        return widest
    }

    /// Largest font size (between 40 and `heightCap`) so every word fits in `maxWidth`, for title-stack sizing.
    static func displayFontSizeCappedByWidth(words: [String], heightCap: CGFloat, maxWidth: CGFloat, epsilon: CGFloat = 3) -> CGFloat {
        let minS: CGFloat = 40
        let cap = min(120, max(minS, heightCap))
        let limit = max(0, maxWidth - epsilon)
        var s = floor(cap)
        while s >= minS {
            if maxDisplayWordWidth(words: words, fontSize: s) <= limit {
                return s
            }
            s -= 1
        }
        return minS
    }

    /// Toolbar row on Categories (compact for ~390pt+ width without horizontal scroll).
    static let categoriesToolbarFontSize: CGFloat = 14
}

/// Custom capsule buttons (avoids `.borderedProminent` system font / metrics drift).
struct AppCapsuleButtonStyle: ButtonStyle {
    let fill: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppFonts.body(size: 15).weight(.medium))
            .foregroundStyle(AppColors.textPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(fill)
            .clipShape(Capsule())
            .opacity(configuration.isPressed ? 0.88 : 1)
    }
}

enum AppColors {
    static let pink = Color(hex: "f472b6")
    static let cyan = Color(red: 0.13, green: 0.83, blue: 0.93)
    static let purple = Color(red: 0.65, green: 0.55, blue: 0.98)
    static let green = Color(red: 0.29, green: 0.87, blue: 0.5)
    static let yellow = Color(red: 0.98, green: 0.8, blue: 0.09)
    static let destructive = Color(hex: "e84a6f")
    /// Primary text color on the app's dark backgrounds (do not use `.primary`).
    static let textPrimary = Color.white
    /// Secondary (muted) text color on the app's dark backgrounds (do not use `.secondary`).
    static let textSecondary = Color.white.opacity(0.7)
    /// Tertiary (more-muted) text color on the app's dark backgrounds.
    static let textTertiary = Color.white.opacity(0.5)
    /// Legacy alias; prefer `textSecondary`.
    static let mutedText = textSecondary
    static let primaryPurple = Color(hex: "9333ea")
    /// Main menu “How to Play” / Categories Sort button.
    static let howToPlayGold = Color(hex: "ca8a04")
    static let barBackground = Color(hex: "140A24").opacity(0.92)
    static let inputBackground = Color(hex: "140A24")
}

/// Categories toolbar: uniform pill height, compact type (scrolls horizontally on narrow widths).
struct CategoriesToolbarCapsuleStyle: ButtonStyle {
    let fill: Color
    var strokeColor: Color = .clear
    var strokeWidth: CGFloat = 0
    var foreground: Color = AppColors.textPrimary
    /// Set false for SF Symbol–only labels so the symbol keeps `sfSymbol` sizing.
    var applyTextFont: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        Group {
            if applyTextFont {
                configuration.label
                    .font(AppFonts.body(size: AppFonts.categoriesToolbarFontSize).weight(.medium))
                    .lineLimit(1)
                    .minimumScaleFactor(0.88)
            } else {
                configuration.label
            }
        }
        .foregroundStyle(foreground)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(minHeight: 44)
        .background(fill)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                // Keep the outline fully inside the capsule bounds to avoid clipping in tight containers.
                .inset(by: strokeWidth / 2)
                .stroke(strokeColor, lineWidth: strokeWidth)
        )
        .opacity(configuration.isPressed ? 0.88 : 1)
    }
}

struct CategoriesToolbarSortButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.88 : 1)
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

extension TeamThemeColor {
    var color: Color {
        Color(hex: String(textHex.dropFirst()))
    }
}
