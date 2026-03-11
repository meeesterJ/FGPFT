import Foundation

struct TeamScore: Codable, Equatable {
    var correct: Int
    var passed: Int
    
    init(correct: Int = 0, passed: Int = 0) {
        self.correct = correct
        self.passed = passed
    }
}

struct TeamThemeColor {
    let name: String
    let textHex: String
    let bgSolidHex: String
    let borderHex: String
    
    static let pink = TeamThemeColor(name: "pink", textHex: "#f472b6", bgSolidHex: "#831843", borderHex: "rgba(244,114,182,0.3)")
    static let cyan = TeamThemeColor(name: "cyan", textHex: "#22d3ee", bgSolidHex: "#164e63", borderHex: "rgba(34,211,238,0.3)")
    static let purple = TeamThemeColor(name: "purple", textHex: "#a78bfa", bgSolidHex: "#581c87", borderHex: "rgba(167,139,250,0.3)")
    static let green = TeamThemeColor(name: "green", textHex: "#4ade80", bgSolidHex: "#14532d", borderHex: "rgba(74,222,128,0.3)")
    static let yellow = TeamThemeColor(name: "yellow", textHex: "#facc15", bgSolidHex: "#713f12", borderHex: "rgba(250,204,21,0.3)")
    
    static let all: [TeamThemeColor] = [.pink, .cyan, .purple, .green, .yellow]
    
    static func forTeam(_ teamNumber: Int) -> TeamThemeColor {
        all[(teamNumber - 1) % all.count]
    }
}

let MAX_TEAM_NAME_LENGTH = 12
