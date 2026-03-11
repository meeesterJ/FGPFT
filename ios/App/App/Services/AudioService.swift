import AVFoundation
import Foundation

final class AudioService {
    static let shared = AudioService()
    private var players: [String: AVAudioPlayer] = [:]
    private let lock = NSLock()
    
    private init() {
        ["correct", "pass", "tick", "tock", "roundEnd", "gameEnd", "applause", "drumroll", "countdown"].forEach { name in
            load(name: name)
        }
    }
    
    private func load(name: String) {
        guard let url = Bundle.main.url(forResource: name, withExtension: "wav", subdirectory: "Audio")
            ?? Bundle.main.url(forResource: name, withExtension: "wav") else { return }
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        let player = try? AVAudioPlayer(contentsOf: url)
        player?.prepareToPlay()
        lock.lock()
        players[name] = player
        lock.unlock()
    }
    
    func play(_ name: String, volume: Float = 1) {
        lock.lock()
        let player = players[name]
        lock.unlock()
        guard let player else { return }
        player.volume = min(1, max(0, volume))
        player.currentTime = 0
        player.play()
    }
    
    func stop(_ name: String) {
        lock.lock()
        let player = players[name]
        lock.unlock()
        player?.stop()
        player?.currentTime = 0
    }
}
