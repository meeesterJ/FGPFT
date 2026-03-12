import SwiftUI

private let studyTimerSteps = [60, 120, 300, 600, 0]
private let studyTimerLabels = ["1 min", "2 min", "5 min", "10 min", "∞"]

struct SettingsView: View {
    @EnvironmentObject var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @State private var teamsExpanded = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                modeToggle
                numberOfTeamsSection
                roundTimerSection
                totalRoundsSection
                soundsSection
                hapticSection
                controlsSection
                aboutLink
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button { dismiss() } label: { Image(systemName: "chevron.left") }
            }
            ToolbarItem(placement: .principal) {
                Text("Settings")
                    .font(AppFonts.body(size: 22))
                    .foregroundStyle(AppColors.mutedText)
            }
        }
    }
    
    private var modeToggle: some View {
        HStack(spacing: 0) {
            Button {
                handleModeToggle(study: false)
            } label: {
                Label("Game Mode", systemImage: "gamecontroller")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .font(AppFonts.body(size: 15))
                    .fontWeight(.medium)
            }
            .buttonStyle(.plain)
            .foregroundStyle(store.studyMode ? AppColors.mutedText : AppColors.pink)
            .background(store.studyMode ? Color.clear : AppColors.pink.opacity(0.25))
            Button {
                handleModeToggle(study: true)
            } label: {
                Label("Study Mode", systemImage: "book")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .font(AppFonts.body(size: 15))
                    .fontWeight(.medium)
            }
            .buttonStyle(.plain)
            .foregroundStyle(store.studyMode ? AppColors.cyan : AppColors.mutedText)
            .background(store.studyMode ? AppColors.cyan.opacity(0.25) : Color.clear)
        }
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(AppColors.purple.opacity(0.4), lineWidth: 1))
    }
    
    private var numberOfTeamsSection: some View {
        SettingsSection(title: "Number of Teams", value: "\(store.studyMode ? 1 : store.numberOfTeams)", color: AppColors.cyan) {
            if !store.studyMode {
                Slider(value: Binding(
                    get: { Double(store.numberOfTeams) },
                    set: { store.setNumberOfTeams(Int($0)) }
                ), in: 1...5, step: 1)
                Button {
                    teamsExpanded.toggle()
                } label: {
                    HStack {
                        Image(systemName: "chevron.down")
                            .rotationEffect(.degrees(teamsExpanded ? 180 : 0))
                        Text("Customize Teams")
                    }
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedText)
                }
                .buttonStyle(.plain)
                if teamsExpanded {
                    VStack(spacing: 12) {
                        ForEach(0..<store.numberOfTeams, id: \.self) { i in
                            TeamNameRow(store: store, index: i)
                        }
                    }
                    .padding(.top, 8)
                }
            }
        }
        .opacity(store.studyMode ? 0.6 : 1)
    }
    
    private var roundTimerSection: some View {
        SettingsSection(
            title: "Round Timer",
            value: store.studyMode
                ? (store.roundDuration == 0 ? "∞" : studyTimerLabels[studyTimerSteps.firstIndex(of: store.roundDuration) ?? 0])
                : "\(store.roundDuration)s",
            color: AppColors.pink
        ) {
            if store.studyMode {
                Slider(value: Binding(
                    get: { Double(studyTimerToSlider(store.roundDuration)) },
                    set: { store.setRoundDuration(sliderToStudyTimer(Int($0))) }
                ), in: 0...4, step: 1)
            } else {
                Slider(value: Binding(
                    get: { Double(store.roundDuration) },
                    set: { store.setRoundDuration(Int($0)) }
                ), in: 5...60, step: 5)
            }
        }
    }
    
    private var totalRoundsSection: some View {
        SettingsSection(title: "Total Rounds", value: "\(store.studyMode ? 1 : store.totalRounds)", color: AppColors.green) {
            if !store.studyMode {
                Slider(value: Binding(
                    get: { Double(store.totalRounds) },
                    set: { store.setTotalRounds(Int($0)) }
                ), in: 1...5, step: 1)
            }
        }
        .opacity(store.studyMode ? 0.6 : 1)
    }
    
    private var soundsSection: some View {
        SettingsSection(title: "Sounds", color: AppColors.yellow) {
            Toggle("", isOn: Binding(
                get: { store.soundEnabled },
                set: { store.setSoundEnabled($0) }
            ))
            .labelsHidden()
            if store.soundEnabled {
                HStack {
                    Text("Volume")
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedText)
                    Spacer()
                    Text("\(store.soundVolume)%")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(AppColors.yellow)
                }
                Slider(value: Binding(
                    get: { Double(store.soundVolume) },
                    set: { store.setSoundVolume(Int($0)) }
                ), in: 0...100, step: 5)
            }
        }
    }
    
    private var hapticSection: some View {
        SettingsSection(title: "Vibration", color: AppColors.green) {
            Toggle("", isOn: Binding(
                get: { store.hapticEnabled },
                set: { store.setHapticEnabled($0) }
            ))
            .labelsHidden()
        }
    }
    
    private var controlsSection: some View {
        SettingsSection(title: "Controls", color: AppColors.purple) {
            HStack {
                Text("Tilt Gestures")
                    .foregroundStyle(AppColors.purple.opacity(0.9))
                Spacer()
                Toggle("", isOn: Binding(
                    get: { store.tiltEnabled },
                    set: { store.setTiltEnabled($0) }
                ))
                .labelsHidden()
            }
            HStack {
                HStack(spacing: 4) {
                    Text("Show Buttons")
                        .foregroundStyle(AppColors.purple.opacity(0.9))
                    if !store.tiltEnabled {
                        Text("Required")
                            .font(.caption2)
                            .italic()
                            .foregroundStyle(AppColors.purple.opacity(0.7))
                    }
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { store.showButtons },
                    set: { store.setShowButtons($0) }
                ))
                .labelsHidden()
                .disabled(store.tiltEnabled)
            }
        }
    }
    
    private var aboutLink: some View {
        HStack {
            Spacer()
            NavigationLink(value: AppRoute.about) {
                Text("About")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.mutedText)
                    .underline()
            }
            .buttonStyle(.plain)
            Spacer()
        }
        .padding(.top, 16)
    }
    
    private func handleModeToggle(study: Bool) {
        store.setStudyMode(study)
        if study {
            store.setNumberOfTeams(1)
            store.setTotalRounds(1)
            if !studyTimerSteps.contains(store.roundDuration) {
                store.setRoundDuration(300)
            }
        } else {
            store.setTiltEnabled(true)
            if studyTimerSteps.contains(store.roundDuration) && store.roundDuration > 60 {
                store.setRoundDuration(30)
            } else if store.roundDuration == 0 {
                store.setRoundDuration(30)
            }
        }
    }
}

private func studyTimerToSlider(_ duration: Int) -> Int {
    studyTimerSteps.firstIndex(of: duration) ?? 0
}

private func sliderToStudyTimer(_ index: Int) -> Int {
    guard index >= 0, index < studyTimerSteps.count else { return 60 }
    return studyTimerSteps[index]
}

struct SettingsSection<Content: View>: View {
    let title: String
    var value: String? = nil
    let color: Color
    @ViewBuilder let content: Content
    
    init(title: String, value: String? = nil, color: Color, @ViewBuilder content: () -> Content) {
        self.title = title
        self.value = value
        self.color = color
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.title3)
                    .fontWeight(.light)
                    .foregroundStyle(color)
                Spacer()
                if let value = value {
                    Text(value)
                        .font(.title2.monospacedDigit())
                        .foregroundStyle(color.opacity(0.9))
                }
            }
            content
        }
        .padding(20)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(color.opacity(0.35), lineWidth: 1))
    }
}

struct TeamNameRow: View {
    @ObservedObject var store: GameStore
    let index: Int
    @State private var localName: String = ""
    @FocusState private var focused: Bool
    
    private var defaultName: String { "Team \(index + 1)" }
    private var theme: TeamThemeColor { TeamThemeColor.forTeam(index + 1) }
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(themeColor(theme.textHex))
                .frame(width: 12, height: 12)
            TextField(defaultName, text: $localName)
                .textFieldStyle(.plain)
                .foregroundStyle(themeColor(theme.textHex))
                .onChange(of: localName) { new in
                    let trimmed = String(new.prefix(MAX_TEAM_NAME_LENGTH))
                    if trimmed != new { localName = trimmed }
                    store.setTeamName(index: index, name: trimmed)
                }
                .onAppear {
                    localName = store.teamNames.indices.contains(index) ? store.teamNames[index] : defaultName
                }
                .focused($focused)
                .onSubmit {
                    if localName.trimmingCharacters(in: .whitespaces).isEmpty {
                        localName = defaultName
                        store.setTeamName(index: index, name: defaultName)
                    }
                }
            Text("\(localName.count)/\(MAX_TEAM_NAME_LENGTH)")
                .font(.caption2)
                .foregroundStyle(AppColors.mutedText)
        }
        .padding(12)
        .background(themeColor(theme.bgSolidHex).opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(themeColor(theme.textHex).opacity(0.4), lineWidth: 1))
    }
    
    private func themeColor(_ hex: String) -> Color {
        let h = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        return Color(hex: h)
    }
}

enum AppColors {
    static let pink = Color(hex: "f472b6")
    static let cyan = Color(red: 0.13, green: 0.83, blue: 0.93)
    static let purple = Color(red: 0.65, green: 0.55, blue: 0.98)
    static let green = Color(red: 0.29, green: 0.87, blue: 0.5)
    static let yellow = Color(red: 0.98, green: 0.8, blue: 0.09)
    static let mutedText = Color.white.opacity(0.7)
}
