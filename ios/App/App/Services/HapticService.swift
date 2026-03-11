import UIKit

enum HapticService {
    static func correct() {
        let gen = UINotificationFeedbackGenerator()
        gen.notificationOccurred(.success)
    }
    
    static func pass() {
        let gen = UINotificationFeedbackGenerator()
        gen.notificationOccurred(.warning)
    }
    
    static func light() {
        let gen = UIImpactFeedbackGenerator(style: .light)
        gen.impactOccurred()
    }
    
    static func medium() {
        let gen = UIImpactFeedbackGenerator(style: .medium)
        gen.impactOccurred()
    }
}
