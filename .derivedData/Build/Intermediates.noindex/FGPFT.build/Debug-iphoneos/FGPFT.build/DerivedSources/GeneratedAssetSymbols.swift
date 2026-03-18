import Foundation
#if canImport(AppKit)
import AppKit
#endif
#if canImport(UIKit)
import UIKit
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif
#if canImport(DeveloperToolsSupport)
import DeveloperToolsSupport
#endif

#if SWIFT_PACKAGE
private let resourceBundle = Foundation.Bundle.module
#else
private class ResourceBundleClass {}
private let resourceBundle = Foundation.Bundle(for: ResourceBundleClass.self)
#endif

// MARK: - Color Symbols -

@available(iOS 11.0, macOS 10.13, tvOS 11.0, *)
extension ColorResource {

}

// MARK: - Image Symbols -

@available(iOS 11.0, macOS 10.7, tvOS 11.0, *)
extension ImageResource {

    /// The "QuickStartHowTo" asset catalog image resource.
    static let quickStartHowTo = ImageResource(name: "QuickStartHowTo", bundle: resourceBundle)

    /// The "Splash" asset catalog image resource.
    static let splash = ImageResource(name: "Splash", bundle: resourceBundle)

    /// The "launch-ipad-2048x2732" asset catalog image resource.
    static let launchIpad2048X2732 = ImageResource(name: "launch-ipad-2048x2732", bundle: resourceBundle)

    /// The "launch-iphone-1125x2436" asset catalog image resource.
    static let launchIphone1125X2436 = ImageResource(name: "launch-iphone-1125x2436", bundle: resourceBundle)

    /// The "launch-iphone-1242x2688" asset catalog image resource.
    static let launchIphone1242X2688 = ImageResource(name: "launch-iphone-1242x2688", bundle: resourceBundle)

    /// The "launch-iphone-640x1136" asset catalog image resource.
    static let launchIphone640X1136 = ImageResource(name: "launch-iphone-640x1136", bundle: resourceBundle)

    /// The "launch-iphone-750x1334" asset catalog image resource.
    static let launchIphone750X1334 = ImageResource(name: "launch-iphone-750x1334", bundle: resourceBundle)

    /// The "launch-iphone-828x1792" asset catalog image resource.
    static let launchIphone828X1792 = ImageResource(name: "launch-iphone-828x1792", bundle: resourceBundle)

}

// MARK: - Color Symbol Extensions -

#if canImport(AppKit)
@available(macOS 10.13, *)
@available(macCatalyst, unavailable)
extension AppKit.NSColor {

}
#endif

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIColor {

}
#endif

#if canImport(SwiftUI)
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Color {

}

@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.ShapeStyle where Self == SwiftUI.Color {

}
#endif

// MARK: - Image Symbol Extensions -

#if canImport(AppKit)
@available(macOS 10.7, *)
@available(macCatalyst, unavailable)
extension AppKit.NSImage {

    /// The "QuickStartHowTo" asset catalog image.
    static var quickStartHowTo: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .quickStartHowTo)
#else
        .init()
#endif
    }

    /// The "Splash" asset catalog image.
    static var splash: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .splash)
#else
        .init()
#endif
    }

    /// The "launch-ipad-2048x2732" asset catalog image.
    static var launchIpad2048X2732: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIpad2048X2732)
#else
        .init()
#endif
    }

    /// The "launch-iphone-1125x2436" asset catalog image.
    static var launchIphone1125X2436: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIphone1125X2436)
#else
        .init()
#endif
    }

    /// The "launch-iphone-1242x2688" asset catalog image.
    static var launchIphone1242X2688: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIphone1242X2688)
#else
        .init()
#endif
    }

    /// The "launch-iphone-640x1136" asset catalog image.
    static var launchIphone640X1136: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIphone640X1136)
#else
        .init()
#endif
    }

    /// The "launch-iphone-750x1334" asset catalog image.
    static var launchIphone750X1334: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIphone750X1334)
#else
        .init()
#endif
    }

    /// The "launch-iphone-828x1792" asset catalog image.
    static var launchIphone828X1792: AppKit.NSImage {
#if !targetEnvironment(macCatalyst)
        .init(resource: .launchIphone828X1792)
#else
        .init()
#endif
    }

}
#endif

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIImage {

    /// The "QuickStartHowTo" asset catalog image.
    static var quickStartHowTo: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .quickStartHowTo)
#else
        .init()
#endif
    }

    /// The "Splash" asset catalog image.
    static var splash: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .splash)
#else
        .init()
#endif
    }

    /// The "launch-ipad-2048x2732" asset catalog image.
    static var launchIpad2048X2732: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIpad2048X2732)
#else
        .init()
#endif
    }

    /// The "launch-iphone-1125x2436" asset catalog image.
    static var launchIphone1125X2436: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIphone1125X2436)
#else
        .init()
#endif
    }

    /// The "launch-iphone-1242x2688" asset catalog image.
    static var launchIphone1242X2688: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIphone1242X2688)
#else
        .init()
#endif
    }

    /// The "launch-iphone-640x1136" asset catalog image.
    static var launchIphone640X1136: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIphone640X1136)
#else
        .init()
#endif
    }

    /// The "launch-iphone-750x1334" asset catalog image.
    static var launchIphone750X1334: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIphone750X1334)
#else
        .init()
#endif
    }

    /// The "launch-iphone-828x1792" asset catalog image.
    static var launchIphone828X1792: UIKit.UIImage {
#if !os(watchOS)
        .init(resource: .launchIphone828X1792)
#else
        .init()
#endif
    }

}
#endif

// MARK: - Thinnable Asset Support -

@available(iOS 11.0, macOS 10.13, tvOS 11.0, *)
@available(watchOS, unavailable)
extension ColorResource {

    private init?(thinnableName: Swift.String, bundle: Foundation.Bundle) {
#if canImport(AppKit) && os(macOS)
        if AppKit.NSColor(named: NSColor.Name(thinnableName), bundle: bundle) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#elseif canImport(UIKit) && !os(watchOS)
        if UIKit.UIColor(named: thinnableName, in: bundle, compatibleWith: nil) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIColor {

    private convenience init?(thinnableResource: ColorResource?) {
#if !os(watchOS)
        if let resource = thinnableResource {
            self.init(resource: resource)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}
#endif

#if canImport(SwiftUI)
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Color {

    private init?(thinnableResource: ColorResource?) {
        if let resource = thinnableResource {
            self.init(resource)
        } else {
            return nil
        }
    }

}

@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.ShapeStyle where Self == SwiftUI.Color {

    private init?(thinnableResource: ColorResource?) {
        if let resource = thinnableResource {
            self.init(resource)
        } else {
            return nil
        }
    }

}
#endif

@available(iOS 11.0, macOS 10.7, tvOS 11.0, *)
@available(watchOS, unavailable)
extension ImageResource {

    private init?(thinnableName: Swift.String, bundle: Foundation.Bundle) {
#if canImport(AppKit) && os(macOS)
        if bundle.image(forResource: NSImage.Name(thinnableName)) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#elseif canImport(UIKit) && !os(watchOS)
        if UIKit.UIImage(named: thinnableName, in: bundle, compatibleWith: nil) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}

#if canImport(AppKit)
@available(macOS 10.7, *)
@available(macCatalyst, unavailable)
extension AppKit.NSImage {

    private convenience init?(thinnableResource: ImageResource?) {
#if !targetEnvironment(macCatalyst)
        if let resource = thinnableResource {
            self.init(resource: resource)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}
#endif

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIImage {

    private convenience init?(thinnableResource: ImageResource?) {
#if !os(watchOS)
        if let resource = thinnableResource {
            self.init(resource: resource)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}
#endif

// MARK: - Backwards Deployment Support -

/// A color resource.
struct ColorResource: Swift.Hashable, Swift.Sendable {

    /// An asset catalog color resource name.
    fileprivate let name: Swift.String

    /// An asset catalog color resource bundle.
    fileprivate let bundle: Foundation.Bundle

    /// Initialize a `ColorResource` with `name` and `bundle`.
    init(name: Swift.String, bundle: Foundation.Bundle) {
        self.name = name
        self.bundle = bundle
    }

}

/// An image resource.
struct ImageResource: Swift.Hashable, Swift.Sendable {

    /// An asset catalog image resource name.
    fileprivate let name: Swift.String

    /// An asset catalog image resource bundle.
    fileprivate let bundle: Foundation.Bundle

    /// Initialize an `ImageResource` with `name` and `bundle`.
    init(name: Swift.String, bundle: Foundation.Bundle) {
        self.name = name
        self.bundle = bundle
    }

}

#if canImport(AppKit)
@available(macOS 10.13, *)
@available(macCatalyst, unavailable)
extension AppKit.NSColor {

    /// Initialize a `NSColor` with a color resource.
    convenience init(resource: ColorResource) {
        self.init(named: NSColor.Name(resource.name), bundle: resource.bundle)!
    }

}

protocol _ACResourceInitProtocol {}
extension AppKit.NSImage: _ACResourceInitProtocol {}

@available(macOS 10.7, *)
@available(macCatalyst, unavailable)
extension _ACResourceInitProtocol {

    /// Initialize a `NSImage` with an image resource.
    init(resource: ImageResource) {
        self = resource.bundle.image(forResource: NSImage.Name(resource.name))! as! Self
    }

}
#endif

#if canImport(UIKit)
@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIColor {

    /// Initialize a `UIColor` with a color resource.
    convenience init(resource: ColorResource) {
#if !os(watchOS)
        self.init(named: resource.name, in: resource.bundle, compatibleWith: nil)!
#else
        self.init()
#endif
    }

}

@available(iOS 11.0, tvOS 11.0, *)
@available(watchOS, unavailable)
extension UIKit.UIImage {

    /// Initialize a `UIImage` with an image resource.
    convenience init(resource: ImageResource) {
#if !os(watchOS)
        self.init(named: resource.name, in: resource.bundle, compatibleWith: nil)!
#else
        self.init()
#endif
    }

}
#endif

#if canImport(SwiftUI)
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Color {

    /// Initialize a `Color` with a color resource.
    init(_ resource: ColorResource) {
        self.init(resource.name, bundle: resource.bundle)
    }

}

@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
extension SwiftUI.Image {

    /// Initialize an `Image` with an image resource.
    init(_ resource: ImageResource) {
        self.init(resource.name, bundle: resource.bundle)
    }

}
#endif