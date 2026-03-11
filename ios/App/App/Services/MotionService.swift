import CoreMotion
import Foundation

/// Detects device posture and tilt for ready screen and gameplay.
final class MotionService: ObservableObject {
    private let motion = CMMotionManager()
    private let queue = OperationQueue()
    
    /// True when device is in landscape and held vertically (screen in vertical plane).
    @Published private(set) var isAtForehead = false
    /// Forward tilt past threshold (for "Tilt to Start" and correct during play).
    @Published private(set) var didTiltForward = false
    /// Back tilt past threshold (for pass during play).
    @Published private(set) var didTiltBack = false
    
    private var onForward: (() -> Void)?
    private var onBack: (() -> Void)?
    private var baseline: (beta: Double, gamma: Double)?
    private let stabilitySamples = 15
    private var sampleCount = 0
    private var stableGravityY: Double?
    private let foreheadThreshold = 0.75
    private let tiltThreshold = 25.0
    private let returnThreshold = 10.0
    private var lastTiltTime: Date?
    private let cooldownMs = 400.0
    
    var isDeviceMotionAvailable: Bool { motion.isDeviceMotionAvailable }
    
    func startMonitoringForReady() {
        guard motion.isDeviceMotionAvailable else {
            isAtForehead = true
            return
        }
        motion.deviceMotionUpdateInterval = 0.05
        motion.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: queue) { [weak self] data, _ in
            guard let self, let data else { return }
            DispatchQueue.main.async {
                self.updateReady(data: data)
            }
        }
    }
    
    func stopMonitoring() {
        motion.stopDeviceMotionUpdates()
        isAtForehead = false
        didTiltForward = false
        didTiltBack = false
        baseline = nil
        sampleCount = 0
        stableGravityY = nil
    }
    
    /// Call when ready to detect "tilt to start" or in-game correct/pass.
    func startTiltDetection(onForward: @escaping () -> Void, onBack: @escaping () -> Void) {
        self.onForward = onForward
        self.onBack = onBack
        didTiltForward = false
        didTiltBack = false
        baseline = nil
        lastTiltTime = nil
    }
    
    func stopTiltDetection() {
        onForward = nil
        onBack = nil
        baseline = nil
    }
    
    private func updateReady(data: CMDeviceMotion) {
        let g = data.gravity
        // In landscape-right, world vertical is along device -y (gravity.y ≈ -1 when upright).
        let gravityY = -g.y
        if abs(gravityY) >= foreheadThreshold {
            if sampleCount < stabilitySamples {
                sampleCount += 1
                if sampleCount == stabilitySamples {
                    stableGravityY = gravityY
                    isAtForehead = true
                }
            }
        } else {
            sampleCount = 0
            isAtForehead = false
        }
        
        guard isAtForehead else { return }
        let beta = data.attitude.pitch * 180 / .pi
        let gamma = data.attitude.roll * 180 / .pi
        
        if baseline == nil {
            baseline = (beta, gamma)
            return
        }
        guard let b = baseline else { return }
        let deltaBeta = beta - b.beta
        if deltaBeta > tiltThreshold {
            if lastTiltTime == nil || Date().timeIntervalSince(lastTiltTime!) > cooldownMs / 1000 {
                didTiltForward = true
                lastTiltTime = Date()
                onForward?()
            }
        } else if deltaBeta < -tiltThreshold {
            if lastTiltTime == nil || Date().timeIntervalSince(lastTiltTime!) > cooldownMs / 1000 {
                didTiltBack = true
                lastTiltTime = Date()
                onBack?()
            }
        }
    }
}
