import CoreMotion
import Foundation

/// Tilt state for direction-based detection
enum TiltState {
    case neutral
    case tiltedForward
    case tiltedBack
}

/// Detects device posture and tilt for ready screen and gameplay.
final class MotionService: ObservableObject {
    private let motion = CMMotionManager()
    private let queue = OperationQueue()
    
    /// True when device is in landscape and held vertically (screen in vertical plane).
    /// Only true when stableGravityX is set and stability sample count has been reached.
    @Published private(set) var isAtForehead = false
    /// Forward tilt past threshold (for correct during play).
    @Published private(set) var didTiltForward = false
    /// Back tilt past threshold (for pass during play).
    @Published private(set) var didTiltBack = false
    /// Current tilt state for direction-based detection
    @Published private(set) var tiltState: TiltState = .neutral
    
    private var onForward: (() -> Void)?
    private var onBack: (() -> Void)?
    private var baselineTiltAngle: Double?
    private let stabilitySamples = 15
    private var sampleCount = 0
    private var stableGravityX: Double?
    private let foreheadThreshold = 0.75
    private let tiltThreshold = 25.0
    private let neutralThreshold = 15.0
    private var lastTiltTime: Date?
    private let debounceMs = 150.0
    
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
        tiltState = .neutral
        baselineTiltAngle = nil
        sampleCount = 0
        stableGravityX = nil
    }
    
    /// Call when ready to detect in-game correct/pass tilts.
    func startTiltDetection(onForward: @escaping () -> Void, onBack: @escaping () -> Void) {
        self.onForward = onForward
        self.onBack = onBack
        didTiltForward = false
        didTiltBack = false
        tiltState = .neutral
        baselineTiltAngle = nil
        lastTiltTime = nil
    }
    
    func stopTiltDetection() {
        onForward = nil
        onBack = nil
        baselineTiltAngle = nil
        tiltState = .neutral
    }
    
    private func updateReady(data: CMDeviceMotion) {
        let g = data.gravity
        // In landscape-left, world vertical is along device +x (gravity.x ≈ 1 when upright at forehead).
        let gravityX = g.x
        if abs(gravityX) >= foreheadThreshold {
            if sampleCount < stabilitySamples {
                sampleCount += 1
                if sampleCount == stabilitySamples {
                    stableGravityX = gravityX
                    isAtForehead = true
                }
            }
        } else {
            sampleCount = 0
            isAtForehead = false
            stableGravityX = nil
            baselineTiltAngle = nil
        }
        
        guard isAtForehead else { return }
        guard onForward != nil || onBack != nil else { return }
        guard let stableX = stableGravityX else { return }
        
        // Detect if gravity.x sign has flipped from baseline - this means phone
        // orientation has changed significantly and we need to recalibrate
        let signFlipped = (stableX >= 0 && g.x < 0) || (stableX < 0 && g.x >= 0)
        if signFlipped {
            stableGravityX = nil
            baselineTiltAngle = nil
            sampleCount = 0
            isAtForehead = false
            return
        }
        
        // Gravity-based tilt angle calculation
        // When vertical at forehead: abs(gravity.x) ≈ 1, gravity.z ≈ 0
        // Forward tilt (top away from face): gravity.z changes
        // Backward tilt (top toward face): gravity.z changes opposite direction
        //
        // Use abs(g.x) for denominator (always positive) and apply sign correction
        // based on stableGravityX to ensure consistent tilt direction regardless
        // of whether gravity.x is positive or negative when phone is at forehead
        let signCorrection = stableX >= 0 ? 1.0 : -1.0
        let tiltAngle = signCorrection * atan2(g.z, abs(g.x)) * 180 / .pi
        
        if baselineTiltAngle == nil {
            baselineTiltAngle = tiltAngle
            tiltState = .neutral
            return
        }
        guard let baseline = baselineTiltAngle else { return }
        let tiltDelta = tiltAngle - baseline
        
        updateTiltState(tiltDelta: tiltDelta)
    }
    
    private func updateTiltState(tiltDelta: Double) {
        let absDelta = abs(tiltDelta)
        let isInNeutralZone = absDelta <= neutralThreshold
        let isTiltedForward = tiltDelta > tiltThreshold
        let isTiltedBack = tiltDelta < -tiltThreshold
        
        switch tiltState {
        case .neutral:
            if isTiltedForward {
                if canTrigger() {
                    tiltState = .tiltedForward
                    didTiltForward = true
                    lastTiltTime = Date()
                    onForward?()
                }
            } else if isTiltedBack {
                if canTrigger() {
                    tiltState = .tiltedBack
                    didTiltBack = true
                    lastTiltTime = Date()
                    onBack?()
                }
            }
            
        case .tiltedForward:
            if isInNeutralZone {
                tiltState = .neutral
            } else if isTiltedBack {
                if canTrigger() {
                    tiltState = .tiltedBack
                    didTiltBack = true
                    lastTiltTime = Date()
                    onBack?()
                }
            }
            
        case .tiltedBack:
            if isInNeutralZone {
                tiltState = .neutral
            } else if isTiltedForward {
                if canTrigger() {
                    tiltState = .tiltedForward
                    didTiltForward = true
                    lastTiltTime = Date()
                    onForward?()
                }
            }
        }
    }
    
    private func canTrigger() -> Bool {
        guard let lastTime = lastTiltTime else { return true }
        return Date().timeIntervalSince(lastTime) > debounceMs / 1000
    }
}
