import SwiftUI

struct DeletedCategoriesView: View {
    @EnvironmentObject var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @State private var confirmDelete: WordList?
    
    private var deletedLists: [WordList] {
        store.getDeletedBuiltInLists()
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if deletedLists.isEmpty {
                    VStack(spacing: 8) {
                        Text("No deleted categories")
                            .font(.title2)
                            .foregroundStyle(AppColors.mutedText)
                        Text("Categories you delete will appear here.")
                            .font(.subheadline)
                            .foregroundStyle(AppColors.mutedText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                } else {
                    Text("Restore categories to make them available again, or permanently delete them.")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.mutedText)
                    
                    LazyVStack(spacing: 12) {
                        ForEach(deletedLists) { list in
                            VStack(alignment: .leading, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(list.name)
                                        .font(.title3)
                                    Text("\(list.words.count) words")
                                        .font(.caption)
                                        .foregroundStyle(AppColors.mutedText)
                                }
                                HStack(spacing: 12) {
                                    Button {
                                        store.restoreBuiltInList(id: list.id)
                                    } label: {
                                        Label("Restore", systemImage: "arrow.uturn.backward")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.bordered)
                                    Button {
                                        confirmDelete = list
                                    } label: {
                                        Label("Delete Forever", systemImage: "trash")
                                            .frame(maxWidth: .infinity)
                                            .foregroundStyle(.red)
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
        .background(BackgroundView())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Back") { dismiss() }
            }
            ToolbarItem(placement: .principal) {
                Text("Deleted Categories")
                    .font(.title2)
            }
        }
        .alert("Delete Forever?", isPresented: Binding(
            get: { confirmDelete != nil },
            set: { if !$0 { confirmDelete = nil } }
        )) {
            Button("Cancel", role: .cancel) { confirmDelete = nil }
            Button("Delete", role: .destructive) {
                if let list = confirmDelete {
                    store.permanentlyDeleteBuiltInList(id: list.id)
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
