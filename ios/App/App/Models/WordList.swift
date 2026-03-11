import Foundation

struct WordList: Codable, Identifiable, Equatable {
    let id: String
    var name: String
    var words: [String]
    var isCustom: Bool?
    var isStudy: Bool?
    
    init(id: String, name: String, words: [String], isCustom: Bool? = nil, isStudy: Bool? = nil) {
        self.id = id
        self.name = name
        self.words = words
        self.isCustom = isCustom
        self.isStudy = isStudy
    }
}

/// Parses study-style word format: "prompt (hint) [answer]" or "prompt [answer]" or plain word.
struct ParsedWord {
    let prompt: String
    let parenthetical: String?
    let answer: String?
}

func parseWordAnswer(_ word: String) -> ParsedWord {
    let trimmed = word.trimmingCharacters(in: .whitespaces)
    guard let bracketRange = trimmed.range(of: "[", options: .backwards),
          let closeBracket = trimmed.range(of: "]", range: bracketRange.upperBound..<trimmed.endIndex) else {
        if let parenOpen = trimmed.range(of: "("),
           let parenClose = trimmed.range(of: ")", range: parenOpen.upperBound..<trimmed.endIndex) {
            let before = String(trimmed[..<parenOpen.lowerBound]).trimmingCharacters(in: .whitespaces)
            let hint = String(trimmed[parenOpen.upperBound..<parenClose.lowerBound])
            return ParsedWord(prompt: before, parenthetical: hint, answer: nil)
        }
        return ParsedWord(prompt: trimmed, parenthetical: nil, answer: nil)
    }
    let rawPrompt = String(trimmed[..<bracketRange.lowerBound]).trimmingCharacters(in: .whitespaces)
    let answer = String(trimmed[bracketRange.upperBound..<closeBracket.lowerBound]).trimmingCharacters(in: .whitespaces)
    if let parenOpen = rawPrompt.range(of: "("),
       let parenClose = rawPrompt.range(of: ")", range: parenOpen.upperBound..<rawPrompt.endIndex) {
        let before = String(rawPrompt[..<parenOpen.lowerBound]).trimmingCharacters(in: .whitespaces)
        let hint = String(rawPrompt[parenOpen.upperBound..<parenClose.lowerBound])
        return ParsedWord(prompt: before, parenthetical: hint, answer: answer)
    }
    return ParsedWord(prompt: rawPrompt, parenthetical: nil, answer: answer)
}
