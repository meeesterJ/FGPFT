import UIKit

/// Manages per-screen interface orientation. Views set the desired mask on appear;
/// AppDelegate returns it from `application(_:supportedInterfaceOrientationsFor:)`.
final class OrientationManager {
    static let shared = OrientationManager()

    var supportedOrientations: UIInterfaceOrientationMask = .portrait {
        didSet {
            guard supportedOrientations != oldValue else { return }
            notifyOrientationUpdate()
        }
    }

    private init() {}

    /// Asks the system to re-query supported orientations so the interface can rotate.
    private func notifyOrientationUpdate() {
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
                  let window = windowScene.windows.first(where: \.isKeyWindow) ?? windowScene.windows.first,
                  let root = window.rootViewController else { return }
            root.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }

    /// Requests the device to rotate to landscape right (e.g. when entering game). Call after setting supportedOrientations to .landscapeRight.
    func requestLandscapeIfNeeded() {
        guard supportedOrientations == .landscapeRight else { return }
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else { return }
            if #available(iOS 16.0, *) {
                windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscapeRight))
            }
        }
    }
}
