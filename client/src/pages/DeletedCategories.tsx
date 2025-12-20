import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { DEFAULT_WORD_LISTS } from "@/lib/words";
import { ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function DeletedCategories() {
  const { toast } = useToast();
  const store = useGameStore();

  const deletedLists = DEFAULT_WORD_LISTS.filter(l => 
    store.deletedBuiltInLists.includes(l.id)
  );

  const handleRestore = (list: typeof DEFAULT_WORD_LISTS[0]) => {
    store.restoreBuiltInList(list.id);
    toast({ title: "Restored", description: `"${list.name}" has been restored.` });
  };

  const handlePermanentDelete = (list: typeof DEFAULT_WORD_LISTS[0]) => {
    store.permanentlyDeleteBuiltInList(list.id);
    toast({ title: "Permanently Deleted", description: `"${list.name}" has been permanently removed.` });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/settings">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4 text-primary">Deleted Categories</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
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
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-card"
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
                      className="text-primary hover:text-primary hover:bg-primary/10 border-primary/50"
                      onClick={() => handleRestore(list)}
                      data-testid={`button-restore-${list.id}`}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                      onClick={() => handlePermanentDelete(list)}
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
    </div>
  );
}
