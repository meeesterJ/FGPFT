import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore, WordList } from "@/lib/store";
import { DEFAULT_WORD_LISTS } from "@/lib/words";
import { ArrowLeft, Plus, Trash2, Edit2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { useSwipeBack } from "@/hooks/use-swipe-back";

const ENABLE_CSV_UPLOAD = false;

export default function Categories() {
  useSwipeBack({ targetPath: "/" });
  const { toast } = useToast();
  const store = useGameStore();
  
  const [newListName, setNewListName] = useState("");
  const [newListWords, setNewListWords] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState("");
  const [editListWords, setEditListWords] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkAddWords, setBulkAddWords] = useState("");
  const [deleteConfirmList, setDeleteConfirmList] = useState<{ id: string; name: string; isCustom: boolean } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const words = results.data.flat().filter(w => typeof w === 'string' && w.trim().length > 0) as string[];
        if (words.length > 0) {
          setNewListWords(prev => (prev ? prev + '\n' : '') + words.join('\n'));
          toast({ title: "Imported!", description: `Added ${words.length} words from CSV.` });
        }
      },
      header: false
    });
  };

  const handleCreateList = () => {
    if (!newListName || !newListWords) return;
    
    const words = newListWords.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (words.length < 5) {
      toast({ title: "Error", description: "List must have at least 5 words.", variant: "destructive" });
      return;
    }

    const newList: WordList = {
      id: `custom-${Date.now()}`,
      name: newListName,
      words,
      isCustom: true
    };

    store.addCustomList(newList);
    setNewListName("");
    setNewListWords("");
    setIsDialogOpen(false);
    toast({ title: "Success", description: "New list created!" });
  };

  const handleStartEdit = (list: WordList) => {
    setEditingListId(list.id);
    setEditListName(list.name);
    setEditListWords([...list.words]);
    setBulkAddWords("");
    setIsEditDialogOpen(true);
  };

  const handleAddWord = () => {
    setEditListWords([...editListWords, ""]);
  };

  const handleBulkAdd = () => {
    if (!bulkAddWords.trim()) return;
    const newWords = bulkAddWords.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    if (newWords.length > 0) {
      setEditListWords([...editListWords, ...newWords]);
      setBulkAddWords("");
      toast({ title: "Added!", description: `Added ${newWords.length} words.` });
    }
  };

  const handleRemoveWord = (index: number) => {
    setEditListWords(editListWords.filter((_, i) => i !== index));
  };

  const handleUpdateWord = (index: number, value: string) => {
    const newWords = [...editListWords];
    newWords[index] = value;
    setEditListWords(newWords);
  };

  const handleSaveEdit = () => {
    if (!editListName || editListWords.length < 5) {
      toast({ title: "Error", description: "List must have at least 5 words.", variant: "destructive" });
      return;
    }

    const filteredWords = editListWords.filter(w => w.trim().length > 0);
    if (filteredWords.length < 5) {
      toast({ title: "Error", description: "List must have at least 5 non-empty words.", variant: "destructive" });
      return;
    }

    const isBuiltIn = DEFAULT_WORD_LISTS.some(l => l.id === editingListId);

    if (isBuiltIn) {
      store.updateBuiltInList(editingListId!, editListName, filteredWords);
      toast({ title: "Success", description: `"${editListName}" has been updated!` });
    } else {
      const updatedList: WordList = {
        id: editingListId!,
        name: editListName,
        words: filteredWords,
        isCustom: true
      };
      store.updateCustomList(editingListId!, updatedList);
      toast({ title: "Success", description: "List updated!" });
    }

    setEditingListId(null);
    setIsEditDialogOpen(false);
  };

  const effectiveBuiltInLists = store.getEffectiveBuiltInLists();
  const allLists = [
    ...effectiveBuiltInLists.filter(l => 
      !store.deletedBuiltInLists.includes(l.id) && 
      !store.permanentlyDeletedBuiltInLists.includes(l.id)
    ).map(l => ({ ...l, isCustom: false })),
    ...store.customLists
  ];

  const deletedLists = DEFAULT_WORD_LISTS.filter(l => 
    store.deletedBuiltInLists.includes(l.id) && 
    !store.permanentlyDeletedBuiltInLists.includes(l.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-cyan-500/30 bg-cyan-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-cyan-400">Word Categories</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4 pb-20">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Select categories to include in your game</p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-pink-500 text-white hover:bg-pink-400 border border-pink-400">
                  <Plus className="w-4 h-4 mr-2" />
                  Create List
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Create Custom List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>List Name</Label>
                    <Input 
                      placeholder="e.g. My Family, Inside Jokes" 
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Words (one per line)</Label>
                    <Textarea 
                      placeholder="Word 1&#10;Word 2&#10;Word 3" 
                      className="h-32"
                      value={newListWords}
                      onChange={e => setNewListWords(e.target.value)}
                    />
                  </div>
                  {ENABLE_CSV_UPLOAD && (
                    <div className="space-y-2">
                      <Label>Or Upload CSV</Label>
                      <Input type="file" accept=".csv" onChange={handleFileUpload} />
                    </div>
                  )}
                  <Button className="w-full" onClick={handleCreateList}>Save List</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmList !== null} onOpenChange={(open) => !open && setDeleteConfirmList(null)}>
              <DialogContent className="bg-card/95 backdrop-blur-md border-red-500/30 max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-xl font-thin text-red-400">Delete Category?</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-muted-foreground">
                    Are you sure you want to delete <span className="text-foreground font-medium">"{deleteConfirmList?.name}"</span>?
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-border hover:bg-muted"
                      onClick={() => setDeleteConfirmList(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white border-red-400"
                      onClick={() => {
                        if (deleteConfirmList) {
                          if (deleteConfirmList.isCustom) {
                            store.removeCustomList(deleteConfirmList.id);
                          } else {
                            store.deleteBuiltInList(deleteConfirmList.id);
                          }
                          toast({ title: "Deleted", description: `"${deleteConfirmList.name}" has been removed.` });
                          setDeleteConfirmList(null);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-h-[80vh] flex flex-col p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className="px-6 pt-6 pb-2">
                  <DialogTitle>Edit List: {editListName}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <div className="flex flex-col gap-4 py-2">
                    {/* Controls at top */}
                    <div className="space-y-2">
                      <Label>List Name</Label>
                      <Input 
                        value={editListName}
                        onChange={e => setEditListName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 border-t border-border pt-4">
                      <Label>Bulk Add Words (one per line)</Label>
                      <Textarea 
                        placeholder={"Word 1\nWord 2\nWord 3"}
                        className="h-20"
                        value={bulkAddWords}
                        onChange={e => setBulkAddWords(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleBulkAdd}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add All Words
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleAddWord}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Empty
                        </Button>
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={handleSaveEdit}>Save Changes</Button>
                    
                    {/* Word list - scrolls with dialog */}
                    <div className="space-y-2 border-t border-border pt-4">
                      <Label>Words ({editListWords.filter(w => w.trim()).length})</Label>
                      <div className="space-y-2">
                        {editListWords.map((word, index) => (
                          <div key={index} className="flex gap-2">
                            <Input 
                              value={word}
                              onChange={e => handleUpdateWord(index, e.target.value)}
                              placeholder={`Word ${index + 1}`}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveWord(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {allLists.map(list => {
              const isSelected = store.selectedListIds.includes(list.id);
              return (
                <div 
                  key={list.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                      : 'border-border bg-card/50 hover:border-cyan-500/50'
                  }`}
                  onClick={() => store.toggleListSelection(list.id)}
                  data-testid={`category-${list.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-muted-foreground'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <h3 className="font-thin">{list.name}</h3>
                      <p className="text-xs text-muted-foreground">{list.words.length} words {list.isCustom && '(Custom)'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(list);
                      }}
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmList({ id: list.id, name: list.name, isCustom: !!list.isCustom });
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {deletedLists.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <Link href="/settings/deleted">
                <Button 
                  variant="outline" 
                  className="w-full text-muted-foreground hover:text-foreground"
                  data-testid="link-deleted-categories"
                >
                  View Deleted Categories ({deletedLists.length})
                </Button>
              </Link>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
