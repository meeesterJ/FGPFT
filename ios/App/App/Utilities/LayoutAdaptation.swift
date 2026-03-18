import UIKit
import SwiftUI

enum LayoutAdaptation {
    static var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }
    
    /// Use when you want a different value for iPhone vs iPad.
    static func value<T>(compact: T, pad: T) -> T {
        isPad ? pad : compact
    }
    
    /// Consistent horizontal content margin (phone-only bump).
    static func contentMargin(compact: CGFloat = 32, pad: CGFloat = 24) -> CGFloat {
        value(compact: compact, pad: pad)
    }
    
    /// Extra inset for the home button overlay on iPhone.
    static func homeButtonExtraInsets(compact: CGFloat = 10, pad: CGFloat = 0) -> CGFloat {
        value(compact: compact, pad: pad)
    }
}

