import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore, WordList } from "@/lib/store";
import { DEFAULT_WORD_LISTS } from "@/lib/words";
import { ArrowLeft, Plus, Trash2, Edit2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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

export default function Settings() {
  const { toast } = useToast();
  const store = useGameStore();
  
  // Custom list form state
  const [newListName, setNewListName] = useState("");
  const [newListWords, setNewListWords] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState("");
  const [editListWords, setEditListWords] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    setIsEditDialogOpen(true);
  };

  const handleAddWord = () => {
    setEditListWords([...editListWords, ""]);
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
      // When editing a built-in list, create a new custom list instead
      const newCustomList: WordList = {
        id: `custom-${Date.now()}`,
        name: editListName,
        words: filteredWords,
        isCustom: true
      };
      store.addCustomList(newCustomList);
      toast({ title: "Success", description: `Created custom list "${editListName}" from built-in list!` });
    } else {
      // Update existing custom list
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

  // Combine and normalize lists for display
  const allLists = [
    ...DEFAULT_WORD_LISTS.map(l => ({ ...l, isCustom: false })),
    ...store.customLists
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4 text-primary">Settings</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">
          
          {/* Game Duration */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Round Timer</h2>
              <span className="text-2xl font-mono text-primary">{store.roundDuration}s</span>
            </div>
            <Slider 
              value={[store.roundDuration]} 
              onValueChange={(v) => store.setRoundDuration(v[0])} 
              min={10} 
              max={120} 
              step={10}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">Adjust how long each guessing round lasts.</p>
          </section>

          {/* Rounds Count */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Total Rounds</h2>
              <span className="text-2xl font-mono text-secondary">{store.totalRounds}</span>
            </div>
            <Slider 
              value={[store.totalRounds]} 
              onValueChange={(v) => store.setTotalRounds(v[0])} 
              min={1} 
              max={10} 
              step={1}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">How many rounds to play before the game ends.</p>
          </section>

          {/* Word Lists */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Word Categories</h2>
              
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
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <h3 className="font-bold">{list.name}</h3>
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
                          } else {
                            // Remove built-in list from selected
                            store.toggleListSelection(list.id);
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
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
