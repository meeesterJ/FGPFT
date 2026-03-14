import UIKit

final class OrientationManager {
    static let shared = OrientationManager()

    var supportedOrientations: UIInterfaceOrientationMask = .portrait {
        didSet {
            guard supportedOrientations != oldValue else { return }
            notifyOrientationUpdate()
        }
    }

    private init() {}

    private func notifyOrientationUpdate() {
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
                  let window = windowScene.windows.first(where: \.isKeyWindow) ?? windowScene.windows.first,
                  let root = window.rootViewController else { return }
            root.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }

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
