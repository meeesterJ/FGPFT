import SwiftUI
import UIKit

private let studyTimerSteps = [60, 120, 300, 600, 0]
private let studyTimerLabels = ["1 min", "2 min", "5 min", "10 min", "∞"]

struct SettingsView: View {
    @EnvironmentObject var store: GameStore
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
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Settings")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.primaryPurple)
            }
        }
    }
    
    private var modeToggle: some View {
        HStack(spacing: 0) {
            Button {
                handleModeToggle(study: false)
            } label: {
                Label("Game Mode", systemImage: "gamecontroller")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
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
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .contentShape(Rectangle())
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
                .tint(AppColors.primaryPurple)
                Button {
                    teamsExpanded.toggle()
                } label: {
                    HStack {
                        Image(systemName: "chevron.down")
                            .rotationEffect(.degrees(teamsExpanded ? 180 : 0))
                            .font(.system(size: 12))
                        Text("Customize Teams")
                            .font(AppFonts.body(size: 12))
                    }
                    .foregroundStyle(AppColors.cyan)
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
                .tint(AppColors.primaryPurple)
            } else {
                Slider(value: Binding(
                    get: { Double(store.roundDuration) },
                    set: { store.setRoundDuration(Int($0)) }
                ), in: 5...60, step: 5)
                .tint(AppColors.primaryPurple)
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
                .tint(AppColors.primaryPurple)
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
            .tint(AppColors.primaryPurple)
            if store.soundEnabled {
                HStack {
                    Text("Volume")
                        .font(AppFonts.body(size: 14))
                        .foregroundStyle(AppColors.yellow)
                    Spacer()
                    Text("\(store.soundVolume)%")
                        .font(AppFonts.body(size: 14).monospacedDigit())
                        .foregroundStyle(AppColors.yellow)
                }
                Slider(value: Binding(
                    get: { Double(store.soundVolume) },
                    set: { store.setSoundVolume(Int($0)) }
                ), in: 0...100, step: 5)
                .tint(AppColors.primaryPurple)
            }
        }
    }
    
    private var hapticSection: some View {
        SettingsSection(title: "Vibration", color: AppColors.cyan) {
            Toggle("", isOn: Binding(
                get: { store.hapticEnabled },
                set: { store.setHapticEnabled($0) }
            ))
            .labelsHidden()
            .tint(AppColors.primaryPurple)
        }
    }
    
    private var controlsSection: some View {
        SettingsSection(title: "Controls", color: AppColors.pink) {
            HStack {
                Text("Tilt Gestures")
                    .font(AppFonts.body(size: 17))
                    .foregroundStyle(AppColors.pink)
                Spacer()
                Toggle("", isOn: Binding(
                    get: { store.tiltEnabled },
                    set: { store.setTiltEnabled($0) }
                ))
                .labelsHidden()
                .tint(AppColors.primaryPurple)
            }
            HStack {
                HStack(spacing: 4) {
                    Text("Show Buttons")
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(AppColors.pink)
                    if !store.tiltEnabled {
                        Text("Required")
                            .font(AppFonts.body(size: 12))
                            .italic()
                            .foregroundStyle(AppColors.pink.opacity(0.7))
                    }
                }
                Spacer()
                Toggle("", isOn: Binding(
                    get: { store.showButtons },
                    set: { store.setShowButtons($0) }
                ))
                .labelsHidden()
                .tint(AppColors.primaryPurple)
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
                    .font(AppFonts.display(size: 20))
                    .foregroundStyle(color)
                Spacer()
                if let value = value {
                    Text(value)
                        .font(AppFonts.body(size: 18).monospacedDigit())
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

// Wraps UITextField so double-tap selects the whole team name for easy editing.
private struct SelectAllTeamNameField: UIViewRepresentable {
    @Binding var text: String
    var placeholder: String
    var textColorHex: String
    var maxLength: Int
    var onSubmit: () -> Void

    private static func uiColor(fromHex hex: String) -> UIColor {
        let hex = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: CGFloat
        switch hex.count {
        case 6:
            r = CGFloat((int >> 16) & 0xFF) / 255
            g = CGFloat((int >> 8) & 0xFF) / 255
            b = CGFloat(int & 0xFF) / 255
        default:
            (r, g, b) = (1, 1, 1)
        }
        return UIColor(red: r, green: g, blue: b, alpha: 1)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> UITextField {
        let field = UITextField()
        field.delegate = context.coordinator
        field.placeholder = placeholder
        field.textColor = Self.uiColor(fromHex: textColorHex)
        field.font = UIFont(name: "Outfit", size: 17) ?? .systemFont(ofSize: 17, weight: .regular)
        field.autocorrectionType = .no
        field.returnKeyType = .done
        field.text = text

        let doubleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.selectAll(_:)))
        doubleTap.numberOfTapsRequired = 2
        field.addGestureRecognizer(doubleTap)

        return field
    }

    func updateUIView(_ uiView: UITextField, context: Context) {
        if uiView.text != text {
            uiView.text = text
        }
        uiView.placeholder = placeholder
        uiView.textColor = Self.uiColor(fromHex: textColorHex)
        uiView.font = UIFont(name: "Outfit", size: 17) ?? .systemFont(ofSize: 17, weight: .regular)
    }

    class Coordinator: NSObject, UITextFieldDelegate {
        var parent: SelectAllTeamNameField

        init(_ parent: SelectAllTeamNameField) {
            self.parent = parent
        }

        @objc func selectAll(_ recognizer: UITapGestureRecognizer) {
            (recognizer.view as? UITextField)?.selectAll(nil)
        }

        func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
            let current = textField.text ?? ""
            guard let range = Range(range, in: current) else { return true }
            let next = current.replacingCharacters(in: range, with: string)
            let trimmed = String(next.prefix(parent.maxLength))
            if trimmed != next {
                textField.text = trimmed
                parent.text = trimmed
                return false
            }
            return true
        }

        func textFieldDidChangeSelection(_ textField: UITextField) {
            let trimmed = String((textField.text ?? "").prefix(parent.maxLength))
            if textField.text != trimmed {
                textField.text = trimmed
            }
            parent.text = trimmed
        }

        func textFieldDidEndEditing(_ textField: UITextField) {
            parent.onSubmit()
        }

        func textFieldShouldReturn(_ textField: UITextField) -> Bool {
            textField.resignFirstResponder()
            parent.onSubmit()
            return true
        }
    }
}

struct TeamNameRow: View {
    @ObservedObject var store: GameStore
    let index: Int
    @State private var localName: String = ""
    
    private var defaultName: String { "Team \(index + 1)" }
    private var theme: TeamThemeColor { TeamThemeColor.forTeam(index + 1) }
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(themeColor(theme.textHex))
                .frame(width: 12, height: 12)
            SelectAllTeamNameField(
                text: $localName,
                placeholder: defaultName,
                textColorHex: theme.textHex,
                maxLength: MAX_TEAM_NAME_LENGTH
            ) {
                if localName.trimmingCharacters(in: .whitespaces).isEmpty {
                    localName = defaultName
                    store.setTeamName(index: index, name: defaultName)
                } else {
                    store.setTeamName(index: index, name: localName)
                }
            }
            Text("\(localName.count)/\(MAX_TEAM_NAME_LENGTH)")
                .font(AppFonts.body(size: 12))
                .foregroundStyle(AppColors.mutedText)
        }
        .padding(12)
        .background(themeColor(theme.bgSolidHex).opacity(0.25))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(themeColor(theme.textHex).opacity(0.4), lineWidth: 1))
        .onAppear {
            localName = store.teamNames.indices.contains(index) ? store.teamNames[index] : defaultName
        }
        .onChange(of: localName) { new in
            let trimmed = String(new.prefix(MAX_TEAM_NAME_LENGTH))
            if trimmed != new {
                localName = trimmed
                return
            }
            store.setTeamName(index: index, name: trimmed)
        }
        .onChange(of: store.teamNames) { _ in
            if store.teamNames.indices.contains(index), localName != store.teamNames[index] {
                localName = store.teamNames[index]
            }
        }
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
    /// Destructive actions (e.g. delete); matches web --destructive: 350 85% 60%
    static let destructive = Color(hex: "e84a6f")
    static let mutedText = Color.white.opacity(0.7)
    /// Web app primary purple (--primary: 270 90% 65%) for sliders and accents
    static let primaryPurple = Color(hex: "9333ea")
    /// Nav bar backgrounds matching main menu button colors (exact hex), with transparency
    static let barTeal = Color(hex: "0891b2").opacity(0.92)
    static let barPurple = Color(hex: "9333ea").opacity(0.92)
    static let barYellow = Color(hex: "ca8a04").opacity(0.92)
    static let barPink = Color(hex: "ec4899").opacity(0.92)
    /// Shared top/bottom bar: transparent #140A24 so content shows through on all screens
    static let barBackground = Color(hex: "140A24").opacity(0.88)
}
