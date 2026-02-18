import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { DEFAULT_WORD_LISTS } from "@/lib/words";
import { ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function DeletedCategories() {
  useSwipeBack({ targetPath: "/categories" });
  const deletedBuiltInLists = useGameStore(s => s.deletedBuiltInLists);
  const permanentlyDeletedBuiltInLists = useGameStore(s => s.permanentlyDeletedBuiltInLists);
  const restoreBuiltInList = useGameStore(s => s.restoreBuiltInList);
  const permanentlyDeleteBuiltInList = useGameStore(s => s.permanentlyDeleteBuiltInList);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const deletedLists = DEFAULT_WORD_LISTS.filter(l => 
    deletedBuiltInLists.includes(l.id) &&
    !permanentlyDeletedBuiltInLists.includes(l.id)
  );

  const handleRestore = (list: typeof DEFAULT_WORD_LISTS[0]) => {
    restoreBuiltInList(list.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-x">
      <header className="p-4 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 safe-area-top">
        <Link href="/categories">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4 text-primary">Deleted Categories</h1>
      </header>

      <ScrollArea className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {deletedLists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground font-thin">No deleted categories</p>
            <p className="text-sm text-muted-foreground mt-2">Categories you delete will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            <p className="text-sm text-muted-foreground mb-6">
              Restore categories to make them available again, or permanently delete them.
            </p>
            
            <div className="grid gap-3">
              {deletedLists.map(list => (
                <div 
                  key={list.id} 
                  className="p-4 rounded-xl border-2 border-border bg-card space-y-3"
                  data-testid={`deleted-category-${list.id}`}
                >
                  <div>
                    <h3 className="font-thin text-lg">{list.name}</h3>
                    <p className="text-xs text-muted-foreground">{list.words.length} words</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/50"
                      onClick={() => handleRestore(list)}
                      data-testid={`button-restore-${list.id}`}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                      onClick={() => setDeleteConfirm({ id: list.id, name: list.name })}
                      data-testid={`button-permanent-delete-${list.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-card flex flex-col items-center justify-center p-8">
          <div className="max-w-sm w-full space-y-8 text-center">
            <Trash2 className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-thin text-red-400">Delete Forever?</h2>
            <p className="text-muted-foreground text-lg">
              Are you sure you want to permanently delete
            </p>
            <p className="text-foreground font-medium text-xl">
              {deleteConfirm.name}
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 border-border hover:bg-muted py-6 text-lg"
                onClick={() => setDeleteConfirm(null)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-400 text-white border-red-400 py-6 text-lg"
                onClick={() => {
                  permanentlyDeleteBuiltInList(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                data-testid="button-confirm-delete"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
