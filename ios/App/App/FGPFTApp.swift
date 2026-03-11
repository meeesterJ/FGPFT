import SwiftUI

@main
struct FGPFTApp: App {
    @StateObject private var store = GameStore()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
