import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: GameStore
    @State private var path = NavigationPath()
    
    var body: some View {
        NavigationStack(path: $path) {
            HomeView(path: $path)
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .settings: SettingsView()
                    case .categories: CategoriesView()
                    case .deletedCategories: DeletedCategoriesView()
                    case .about: AboutView()
                    case .howToPlay: HowToPlayView()
                    case .privacy: PrivacyView()
                    case .terms: TermsView()
                    case .game: GameView(path: $path)
                    case .summary: SummaryView(path: $path)
                    }
                }
        }
    }
}

enum AppRoute: Hashable {
    case settings, categories, deletedCategories, about, howToPlay, privacy, terms, game, summary
}
