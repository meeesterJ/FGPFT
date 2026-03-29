import SwiftUI

private enum CategorySortMode: CaseIterable, Equatable {
    case sortDefault
    case customOnly
    case newFirst
    case oldFirst
    case alpha
    case favoritesOnly

    var label: String {
        switch self {
        case .sortDefault: return "Sort"
        case .customOnly: return "Custom"
        case .newFirst: return "New"
        case .oldFirst: return "Old"
        case .alpha: return "Alpha"
        case .favoritesOnly: return "Fav"
        }
    }

    mutating func advance() {
        let all = Self.allCases
        let i = (all.firstIndex(of: self)! + 1) % all.count
        self = all[i]
    }
}

struct CategoriesView: View {
    @EnvironmentObject var store: GameStore
    @State private var showCreate = false
    @State private var editingList: WordList?
    @State private var scrollToListId: String?
    @State private var showStudyListsOnly = false
    @State private var sortMode: CategorySortMode = .sortDefault

    private var effectiveBuiltIn: [WordList] {
        store.getEffectiveBuiltInLists().filter {
            !store.deletedBuiltInLists.contains($0.id) && !store.permanentlyDeletedBuiltInLists.contains($0.id)
        }
    }

    private var allLists: [WordList] {
        effectiveBuiltIn.map { WordList(id: $0.id, name: $0.name, words: $0.words, isCustom: false, isStudy: $0.isStudy) }
            + store.customLists
    }

    private var deletedCount: Int {
        store.getDeletedBuiltInLists().count + store.getDeletedCustomLists().count
    }

    private func studyFilteredBase(from lists: [WordList]) -> [WordList] {
        lists.filter { showStudyListsOnly ? ($0.isStudy == true) : ($0.isStudy != true) }
    }

    private func customTimestamp(from id: String) -> Int {
        guard id.hasPrefix("custom-"), let n = Int(id.dropFirst("custom-".count)) else { return 0 }
        return n
    }

    /// Lists shown in the categories list (study filter + sort mode). Fav ignores study/game filter.
    private func listsForDisplay() -> [WordList] {
        switch sortMode {
        case .favoritesOnly:
            return allLists.filter { store.favoriteListIds.contains($0.id) }
        case .sortDefault:
            return studyFilteredBase(from: allLists)
        case .customOnly:
            return studyFilteredBase(from: allLists).filter { $0.isCustom == true }
        case .newFirst:
            let base = studyFilteredBase(from: allLists)
            let customs = base.filter { $0.isCustom == true }
            let builtIns = base.filter { $0.isCustom != true }
            let sortedCustoms = customs.sorted { customTimestamp(from: $0.id) > customTimestamp(from: $1.id) }
            return sortedCustoms + builtIns
        case .oldFirst:
            let base = studyFilteredBase(from: allLists)
            let customs = base.filter { $0.isCustom == true }
            let builtIns = base.filter { $0.isCustom != true }
            let sortedCustoms = customs.sorted { customTimestamp(from: $0.id) < customTimestamp(from: $1.id) }
            return sortedCustoms + builtIns
        case .alpha:
            return studyFilteredBase(from: allLists)
                .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        }
    }

    private func deleteList(_ list: WordList) {
        if list.isCustom == true {
            store.removeCustomList(id: list.id)
        } else {
            store.deleteBuiltInList(id: list.id)
        }
    }

    private var listRowLeadingInset: CGFloat {
        LayoutAdaptation.contentMargin(compact: 16, pad: 0) + LayoutAdaptation.contentMargin(compact: 8, pad: 16)
    }

    private var listRowTrailingInset: CGFloat {
        LayoutAdaptation.contentMargin(compact: 16, pad: 0)
    }

    private func emptyStateMessage() -> String {
        switch sortMode {
        case .customOnly:
            return "No custom lists in this view. Create a list or change filters."
        case .favoritesOnly:
            return "No favorite lists yet. Swipe right on a list to favorite it."
        default:
            return "No lists match the current filter."
        }
    }

    private func pruneSelectionsToMatchVisibleLists() {
        let lists = listsForDisplay()
        let visible = Set(lists.map(\.id))
        let kept = store.selectedListIds.filter { visible.contains($0) }
        if lists.isEmpty {
            store.setSelectedListIds([])
        } else if kept.isEmpty {
            store.setSelectedListIds([lists[0].id])
        } else if kept.count != store.selectedListIds.count || kept != store.selectedListIds {
            store.setSelectedListIds(kept)
        }
    }

    private var categoriesToolbarRow: some View {
        let toolbarFont = AppFonts.body(size: AppFonts.categoriesToolbarFontSize).weight(.medium)
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 9) {
                Button {
                    store.clearListSelections()
                } label: {
                    Text("Clear")
                }
                .buttonStyle(CategoriesToolbarCapsuleStyle(fill: AppColors.green))

                Button {
                    showCreate = true
                } label: {
                    Text("+Create")
                }
                .buttonStyle(CategoriesToolbarCapsuleStyle(fill: AppColors.pink))

                Button {
                    showStudyListsOnly.toggle()
                } label: {
                    Image(systemName: "book.fill")
                        .font(AppFonts.sfSymbol(size: 12))
                }
                .buttonStyle(
                    CategoriesToolbarCapsuleStyle(
                        fill: showStudyListsOnly ? AppColors.cyan.opacity(0.2) : AppColors.primaryPurple,
                        strokeColor: showStudyListsOnly ? AppColors.cyan : .clear,
                        strokeWidth: showStudyListsOnly ? 2 : 0,
                        foreground: showStudyListsOnly ? AppColors.cyan : .white,
                        applyTextFont: false
                    )
                )
                .accessibilityLabel(showStudyListsOnly ? "Showing study lists only" : "Showing game lists only")

                Button {
                    sortMode.advance()
                } label: {
                    ZStack {
                        HStack(spacing: 4) {
                            Text("Custom")
                            Text("Fav")
                        }
                            .font(toolbarFont)
                            .lineLimit(1)
                            .minimumScaleFactor(0.88)
                            .opacity(0)
                            .accessibilityHidden(true)
                        Text(sortMode.label)
                            .font(toolbarFont)
                            .lineLimit(1)
                            .minimumScaleFactor(0.88)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(minHeight: 40)
                    .background(AppColors.howToPlayGold)
                    .clipShape(Capsule())
                }
                .buttonStyle(CategoriesToolbarSortButtonStyle())
                .accessibilityLabel("Sort lists, \(sortMode.label)")
            }
            // Match listRowLeadingInset / listRowTrailingInset so toolbar aligns with category rows.
            .padding(.leading, listRowLeadingInset)
            .padding(.trailing, listRowTrailingInset)
        }
    }

    var body: some View {
        let displayedLists = listsForDisplay()
        let rowInsets = EdgeInsets(
            top: 6,
            leading: listRowLeadingInset,
            bottom: 6,
            trailing: listRowTrailingInset
        )
        VStack(alignment: .leading, spacing: 16) {
            categoriesToolbarRow
                .padding(.bottom, 4)
                .dynamicTypeSize(.medium ... .xLarge)

            ScrollViewReader { proxy in
                List {
                    if displayedLists.isEmpty {
                        Text(emptyStateMessage())
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(AppColors.mutedText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 24)
                            .padding(.horizontal, LayoutAdaptation.contentMargin(compact: 0, pad: 16))
                            .listRowInsets(rowInsets)
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    } else {
                        ForEach(displayedLists) { list in
                            let favorited = store.isFavorite(id: list.id)
                            CategoryRow(
                                list: list,
                                isSelected: store.selectedListIds.contains(list.id),
                                isFavorite: favorited,
                                onToggle: { store.toggleListSelection(id: list.id) },
                                onToggleFavorite: { store.toggleFavorite(id: list.id) },
                                onEdit: { editingList = list },
                                onDelete: { deleteList(list) }
                            )
                            .id(list.id)
                            .listRowInsets(rowInsets)
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                                Button {
                                    store.toggleFavorite(id: list.id)
                                } label: {
                                    Label(
                                        favorited ? "Unfavorite" : "Favorite",
                                        systemImage: favorited ? "star.slash.fill" : "star.fill"
                                    )
                                }
                                .tint(AppColors.howToPlayGold)
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    deleteList(list)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    if deletedCount > 0 {
                        NavigationLink(value: AppRoute.deletedCategories) {
                            Text("View Deleted Categories (\(deletedCount))")
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                        .buttonStyle(.bordered)
                        .foregroundStyle(AppColors.mutedText)
                        .listRowInsets(EdgeInsets(
                            top: 8,
                            leading: listRowLeadingInset,
                            bottom: 8,
                            trailing: listRowTrailingInset
                        ))
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .environment(\.defaultMinListRowHeight, 1)
                .onChange(of: scrollToListId) { newId in
                    guard let id = newId else { return }
                    proxy.scrollTo(id, anchor: .center)
                    scrollToListId = nil
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding(.horizontal, 0)
        }
        .padding(.top, 20)
        .transparentPurpleBottomBar()
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Word Categories")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.cyan)
            }
        }
        .onAppear {
            pruneSelectionsToMatchVisibleLists()
        }
        .onChange(of: showStudyListsOnly) { _ in
            pruneSelectionsToMatchVisibleLists()
        }
        .onChange(of: sortMode) { _ in
            pruneSelectionsToMatchVisibleLists()
        }
        .onChange(of: store.favoriteListIds) { _ in
            pruneSelectionsToMatchVisibleLists()
        }
        .onDisappear {
            let lists = listsForDisplay()
            if store.selectedListIds.isEmpty, let first = lists.first {
                store.setSelectedListIds([first.id])
            }
        }
        .sheet(isPresented: $showCreate) {
            AddCategorySheet(store: store) { createdListId in
                showCreate = false
                if let id = createdListId {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                        scrollToListId = id
                    }
                }
            }
        }
        .sheet(item: $editingList) { list in
            EditCategorySheet(store: store, list: list) { editingList = nil }
        }
    }
}

struct CategoryRow: View {
    let list: WordList
    let isSelected: Bool
    let isFavorite: Bool
    let onToggle: () -> Void
    let onToggleFavorite: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: 0) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? AppColors.cyan : Color.white.opacity(0.4), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if isSelected {
                        Circle()
                            .fill(AppColors.cyan)
                            .frame(width: 10, height: 10)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(list.name)
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(AppColors.textPrimary)
                    Text("\(list.words.count) words\(list.isCustom == true ? " (Custom)" : "")\(list.isStudy == true ? "  ·  Study" : "")")
                        .font(AppFonts.body(size: 12))
                        .foregroundStyle(AppColors.mutedText)
                }
                Spacer(minLength: 8)
            }
            .contentShape(Rectangle())
            .onTapGesture { onToggle() }
            
            HStack(spacing: 0) {
                if isFavorite {
                    Button(action: onToggleFavorite) {
                        Image(systemName: "star.fill")
                            .foregroundStyle(AppColors.howToPlayGold)
                            .font(AppFonts.sfSymbol(size: 16))
                            .frame(width: 44, height: 44)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Remove from favorites")
                }
                if list.isStudy == true {
                    Image(systemName: "book.fill")
                        .foregroundStyle(isSelected ? AppColors.cyan : AppColors.mutedText)
                        .font(AppFonts.sfSymbol(size: 16))
                        .frame(width: 44, height: 44)
                        .accessibilityHidden(true)
                }
                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .foregroundStyle(AppColors.yellow)
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundStyle(.red)
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 16)
        .padding(.leading, 10)
        .background(isSelected ? AppColors.cyan.opacity(0.2) : Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(isSelected ? AppColors.cyan : Color.white.opacity(0.15), lineWidth: isSelected ? 2 : 1))
    }
}

private struct WordListEditorSection: View {
    @Binding var text: String
    var expandingEditor: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Words (one per line)")
                .font(AppFonts.body(baseSize: 17, textStyle: .subheadline))
                .foregroundStyle(.white)
            TextEditor(text: $text)
                .font(AppFonts.body(baseSize: 19, textStyle: .body))
                .foregroundStyle(.white)
                .scrollContentBackground(.hidden)
                .frame(minHeight: expandingEditor ? 120 : 140)
                .frame(maxWidth: .infinity, maxHeight: expandingEditor ? .infinity : nil)
                .padding(12)
                .background(AppColors.inputBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .frame(maxWidth: .infinity, maxHeight: expandingEditor ? .infinity : nil, alignment: .topLeading)
    }
}

struct AddCategorySheet: View {
    @ObservedObject var store: GameStore
    let onDismiss: (String?) -> Void
    @State private var name = ""
    @State private var wordsText = ""
    @State private var isStudy = false
    @State private var errorMessage: String?
    
    private var createPink: Color { Color(hex: "ec4899") }
    
    var body: some View {
        let navigationStack = NavigationStack {
            ZStack(alignment: .top) {
                createPink
                    .ignoresSafeArea()
                VStack(alignment: .leading, spacing: 12) {
                    Color.clear.frame(height: 8)
                    Text("List Name")
                        .font(AppFonts.body(size: 15))
                        .foregroundStyle(.white)
                    TextField("Name", text: $name)
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(.white)
                        .padding(12)
                        .frame(maxWidth: .infinity)
                        .background(AppColors.inputBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    HStack {
                        Text("Study Mode")
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(.white)
                        Spacer()
                        Toggle("", isOn: $isStudy)
                            .labelsHidden()
                            .tint(AppColors.primaryPurple)
                    }
                    .padding(12)
                    .background(AppColors.inputBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    if let err = errorMessage {
                        Text(err)
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(.red)
                    }
                    WordListEditorSection(text: $wordsText, expandingEditor: true)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, LayoutAdaptation.value(compact: 32, pad: 28))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(createPink, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { onDismiss(nil) }
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .principal) {
                    Text("Create List")
                        .font(AppFonts.display(size: 22))
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { create() }
                        .font(AppFonts.body(size: 17).weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
        }
        if #available(iOS 16.4, *) {
            navigationStack.presentationBackground(createPink)
        } else {
            navigationStack
        }
    }
    
    private func create() {
        let words = wordsText.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Enter a name."
            return
        }
        guard words.count >= 5 else {
            errorMessage = "List must have at least 5 words."
            return
        }
        let list = WordList(id: "custom-\(Int(Date().timeIntervalSince1970))", name: name.trimmingCharacters(in: .whitespaces), words: words, isCustom: true, isStudy: isStudy)
        store.addCustomList(list)
        onDismiss(list.id)
    }
}

struct EditCategorySheet: View {
    @ObservedObject var store: GameStore
    let list: WordList
    let onDismiss: () -> Void
    @State private var name: String
    @State private var words: [String]
    @State private var isStudy: Bool
    @State private var errorMessage: String?
    
    init(store: GameStore, list: WordList, onDismiss: @escaping () -> Void) {
        self.store = store
        self.list = list
        self.onDismiss = onDismiss
        _name = State(initialValue: list.name)
        _words = State(initialValue: list.words)
        _isStudy = State(initialValue: list.isStudy ?? false)
    }
    
    private var wordsText: Binding<String> {
        Binding(
            get: { words.joined(separator: "\n") },
            set: { words = $0.split(separator: "\n").map { String($0).trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty } }
        )
    }
    
    private var editYellow: Color { Color(hex: "ca8a04") }
    
    var body: some View {
        let navigationStack = NavigationStack {
            ZStack(alignment: .top) {
                editYellow
                    .ignoresSafeArea()
                VStack(alignment: .leading, spacing: 12) {
                    Color.clear.frame(height: 8)
                    Text("List Name")
                        .font(AppFonts.body(size: 15))
                        .foregroundStyle(.white)
                    TextField("Name", text: $name)
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(.white)
                        .padding(12)
                        .frame(maxWidth: .infinity)
                        .background(AppColors.inputBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    HStack {
                        Text("Study Mode")
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(.white)
                        Spacer()
                        Toggle("", isOn: $isStudy)
                            .labelsHidden()
                            .tint(AppColors.primaryPurple)
                    }
                    .padding(12)
                    .background(AppColors.inputBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    if let err = errorMessage {
                        Text(err)
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(.red)
                    }
                    WordListEditorSection(text: wordsText, expandingEditor: true)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, LayoutAdaptation.value(compact: 32, pad: 28))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(editYellow, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { onDismiss() }
                        .font(AppFonts.body(size: 17))
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .principal) {
                    Text("Edit List")
                        .font(AppFonts.display(size: 22))
                        .foregroundStyle(.white)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .font(AppFonts.body(size: 17).weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
        }
        if #available(iOS 16.4, *) {
            navigationStack.presentationBackground(editYellow)
        } else {
            navigationStack
        }
    }
    
    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let filtered = words.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        guard !trimmedName.isEmpty else {
            errorMessage = "Enter a name."
            return
        }
        guard filtered.count >= 5 else {
            errorMessage = "List must have at least 5 non-empty words."
            return
        }
        let isBuiltIn = list.isCustom != true
        if isBuiltIn {
            store.updateBuiltInList(id: list.id, name: trimmedName, words: filtered, isStudy: isStudy)
        } else {
            let updated = WordList(id: list.id, name: trimmedName, words: filtered, isCustom: true, isStudy: isStudy)
            store.updateCustomList(id: list.id, updatedList: updated)
        }
        onDismiss()
    }
}
