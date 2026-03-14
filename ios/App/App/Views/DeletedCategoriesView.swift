import SwiftUI

struct DeletedCategoriesView: View {
    @EnvironmentObject var store: GameStore
    @State private var confirmDelete: WordList?
    
    private var deletedLists: [WordList] {
        store.getDeletedBuiltInLists() + store.getDeletedCustomLists()
    }
    
    private func restore(list: WordList) {
        if list.isCustom == true {
            store.restoreCustomList(id: list.id)
        } else {
            store.restoreBuiltInList(id: list.id)
        }
    }
    
    private func permanentlyDelete(list: WordList) {
        if list.isCustom == true {
            store.permanentlyDeleteCustomList(id: list.id)
        } else {
            store.permanentlyDeleteBuiltInList(id: list.id)
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if deletedLists.isEmpty {
                    VStack(spacing: 8) {
                        Text("No deleted categories")
                            .font(AppFonts.body(size: 20))
                            .foregroundStyle(AppColors.mutedText)
                        Text("Categories you delete will appear here.")
                            .font(AppFonts.body(size: 15))
                            .foregroundStyle(AppColors.mutedText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else {
                    Text("Restore categories to make them available again, or permanently delete them.")
                        .font(AppFonts.body(size: 15))
                        .foregroundStyle(AppColors.mutedText)
                    
                    LazyVStack(spacing: 12) {
                        ForEach(deletedLists) { list in
                            VStack(alignment: .leading, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(list.name)
                                        .font(AppFonts.body(size: 17).weight(.semibold))
                                    Text("\(list.words.count) words\(list.isCustom == true ? " (Custom)" : "")")
                                        .font(AppFonts.body(size: 12))
                                        .foregroundStyle(AppColors.mutedText)
                                }
                                HStack(spacing: 12) {
                                    Button {
                                        restore(list: list)
                                    } label: {
                                        Label("Restore", systemImage: "arrow.uturn.backward")
                                            .frame(maxWidth: .infinity)
                                            .font(AppFonts.body(size: 17))
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(AppColors.cyan)
                                    Button {
                                        confirmDelete = list
                                    } label: {
                                        Label("Delete Forever", systemImage: "trash")
                                            .frame(maxWidth: .infinity)
                                            .font(AppFonts.body(size: 17))
                                            .foregroundStyle(AppColors.destructive)
                                    }
                                    .buttonStyle(.bordered)
                                }
                            }
                            .padding(16)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
            .padding(20)
            .padding(.bottom, 40)
        }
        .transparentPurpleBottomBar()
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(AppColors.barBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Deleted Categories")
                    .font(AppFonts.display(size: 22))
                    .foregroundStyle(AppColors.cyan)
            }
        }
        .alert("Delete Forever?", isPresented: Binding(
            get: { confirmDelete != nil },
            set: { if !$0 { confirmDelete = nil } }
        )) {
            Button("Cancel", role: .cancel) { confirmDelete = nil }
            Button("Delete", role: .destructive) {
                if let list = confirmDelete {
                    permanentlyDelete(list: list)
                    confirmDelete = nil
                }
            }
        } message: {
            if let list = confirmDelete {
                Text("Are you sure you want to permanently delete \"\(list.name)\"?")
            }
        }
    }
}
