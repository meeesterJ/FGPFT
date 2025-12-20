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

export default function Categories() {
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
    const newWords = bulkAddWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4 text-primary">Word Categories</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4 pb-20">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Select categories to include in your game</p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create List
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                  <div className="space-y-2">
                    <Label>Or Upload CSV</Label>
                    <Input type="file" accept=".csv" onChange={handleFileUpload} />
                  </div>
                  <Button className="w-full" onClick={handleCreateList}>Save List</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit List: {editListName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>List Name</Label>
                    <Input 
                      value={editListName}
                      onChange={e => setEditListName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Words ({editListWords.filter(w => w.trim()).length})</Label>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleAddWord}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Word
                  </Button>
                  
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label>Bulk Add Words (comma separated)</Label>
                    <Textarea 
                      placeholder="word1, word2, word3, word4"
                      className="h-20"
                      value={bulkAddWords}
                      onChange={e => setBulkAddWords(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleBulkAdd}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add All Words
                    </Button>
                  </div>
                  
                  <Button className="w-full" onClick={handleSaveEdit}>Save Changes</Button>
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
                      ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => store.toggleListSelection(list.id)}
                  data-testid={`category-${list.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
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
                      className="text-primary hover:text-primary hover:bg-primary/10"
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (list.isCustom) {
                          store.removeCustomList(list.id);
                          toast({ title: "Deleted", description: `"${list.name}" has been removed.` });
                        } else {
                          store.deleteBuiltInList(list.id);
                          toast({ title: "Deleted", description: `"${list.name}" has been deleted.` });
                        }
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
