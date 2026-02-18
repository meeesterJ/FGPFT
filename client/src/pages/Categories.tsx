import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore, WordList } from "@/lib/store";
import { DEFAULT_WORD_LISTS } from "@/lib/words";
import { ArrowLeft, Plus, Trash2, Edit2, X, BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from "papaparse";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useIsLandscape } from "@/hooks/use-landscape";

const ENABLE_CSV_UPLOAD = false;

export default function Categories() {
  useSwipeBack({ targetPath: "/" });
  const { toast } = useToast();
  const store = useGameStore();
  const isLandscape = useIsLandscape();
  
  const [newListName, setNewListName] = useState("");
  const [newListWords, setNewListWords] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState("");
  const [editListWords, setEditListWords] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkAddWords, setBulkAddWords] = useState("");
  const [newListIsStudy, setNewListIsStudy] = useState(false);
  const [editListIsStudy, setEditListIsStudy] = useState(false);

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
      isCustom: true,
      isStudy: newListIsStudy
    };

    store.addCustomList(newList);
    setNewListName("");
    setNewListWords("");
    setNewListIsStudy(false);
    setIsDialogOpen(false);
    toast({ title: "Success", description: "New list created!" });
  };

  const handleStartEdit = (list: WordList) => {
    setEditingListId(list.id);
    setEditListName(list.name);
    setEditListWords([...list.words]);
    setEditListIsStudy(!!list.isStudy);
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
      store.updateBuiltInList(editingListId!, editListName, filteredWords, editListIsStudy);
      toast({ title: "Success", description: `"${editListName}" has been updated!` });
    } else {
      const updatedList: WordList = {
        id: editingListId!,
        name: editListName,
        words: filteredWords,
        isCustom: true,
        isStudy: editListIsStudy
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

      <ScrollArea className="flex-1 p-6 w-full">
        <div className={`pb-20 mx-auto ${isLandscape ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Select categories to include in your game</p>
              
              <Button size="sm" className="bg-pink-500 text-white hover:bg-pink-400 border border-pink-400 shrink-0" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create List
              </Button>
            </div>

            <div className={`grid gap-3 ${isLandscape ? 'grid-cols-2' : ''}`}>
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
                        <p className="text-xs text-muted-foreground">
                          {list.words.length} words{list.isCustom ? ' (Custom)' : ''}{list.isStudy ? ' · Study' : ''}
                        </p>
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
                          if (list.isCustom) {
                            store.removeCustomList(list.id);
                          } else {
                            store.deleteBuiltInList(list.id);
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
        </div>
      </ScrollArea>

      {/* Create Custom List - Full Screen */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-card flex flex-col">
          <header className="p-4 flex items-center border-b border-pink-500/30 bg-pink-900/20 backdrop-blur-md">
            <Button variant="ghost" size="icon" className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/20" onClick={() => setIsDialogOpen(false)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-thin ml-4 text-pink-400">Create Custom List</h1>
          </header>
          <ScrollArea className="flex-1 p-6 w-full">
            <div className="max-w-2xl mx-auto space-y-6">
              <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
                <div className="space-y-2">
                  <Label className="text-pink-300">List Name</Label>
                  <Input 
                    placeholder="e.g. My Family, Inside Jokes" 
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    data-testid="input-new-list-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-pink-300">Words (one per line)</Label>
                  <Textarea 
                    placeholder={"Word 1\nWord 2\nWord 3"} 
                    className="h-40"
                    value={newListWords}
                    onChange={e => setNewListWords(e.target.value)}
                    data-testid="textarea-new-list-words"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <Label htmlFor="new-study-toggle" className="text-pink-300">Study Mode</Label>
                  </div>
                  <Switch
                    id="new-study-toggle"
                    checked={newListIsStudy}
                    onCheckedChange={setNewListIsStudy}
                    data-testid="toggle-study-create"
                  />
                </div>
                {newListIsStudy && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-2">
                    <p className="text-purple-300 text-sm font-medium">Formatting Tip</p>
                    <p className="text-muted-foreground text-sm">
                      <span className="text-purple-300">Word (helper text) [answer]</span>
                    </p>
                    <p className="text-muted-foreground text-xs">Helper text and answers are optional. Use helper text for hints shown below the word, and answers for tap-to-reveal.</p>
                    <p className="text-muted-foreground text-xs italic">Example: Hola (greeting) [Hello]</p>
                  </div>
                )}
                {ENABLE_CSV_UPLOAD && (
                  <div className="space-y-2">
                    <Label className="text-pink-300">Or Upload CSV</Label>
                    <Input type="file" accept=".csv" onChange={handleFileUpload} />
                  </div>
                )}
              </section>
              <Button className="w-full bg-pink-500 hover:bg-pink-400 text-white border border-pink-400" onClick={handleCreateList} data-testid="button-save-new-list">
                Save List
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Edit List - Full Screen */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-card flex flex-col">
          <header className="p-4 flex items-center border-b border-yellow-500/30 bg-yellow-900/20 backdrop-blur-md">
            <Button variant="ghost" size="icon" className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20" onClick={() => setIsEditDialogOpen(false)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-thin ml-4 text-yellow-400">Edit List: {editListName}</h1>
          </header>
          <ScrollArea className="flex-1 p-6 w-full">
            <div className="max-w-2xl mx-auto space-y-6">
              <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
                <div className="space-y-2">
                  <Label className="text-yellow-300">List Name</Label>
                  <Input 
                    value={editListName}
                    onChange={e => setEditListName(e.target.value)}
                    data-testid="input-edit-list-name"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <Label htmlFor="edit-study-toggle" className="text-yellow-300">Study Mode</Label>
                  </div>
                  <Switch
                    id="edit-study-toggle"
                    checked={editListIsStudy}
                    onCheckedChange={setEditListIsStudy}
                    data-testid="toggle-study-edit"
                  />
                </div>
                {editListIsStudy && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-2">
                    <p className="text-purple-300 text-sm font-medium">Formatting Tip</p>
                    <p className="text-muted-foreground text-sm">
                      <span className="text-purple-300">Word (helper text) [answer]</span>
                    </p>
                    <p className="text-muted-foreground text-xs">Helper text and answers are optional. Use helper text for hints shown below the word, and answers for tap-to-reveal.</p>
                    <p className="text-muted-foreground text-xs italic">Example: Hola (greeting) [Hello]</p>
                  </div>
                )}
              </section>

              <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
                <Label className="text-yellow-300">Bulk Add Words (one per line)</Label>
                <Textarea 
                  placeholder={"Word 1\nWord 2\nWord 3"}
                  className="h-24"
                  value={bulkAddWords}
                  onChange={e => setBulkAddWords(e.target.value)}
                  data-testid="textarea-bulk-add"
                />
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-yellow-500/30 hover:bg-yellow-500/10"
                    onClick={handleBulkAdd}
                    data-testid="button-bulk-add"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add All Words
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-yellow-500/30 hover:bg-yellow-500/10"
                    onClick={handleAddWord}
                    data-testid="button-add-empty"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Empty
                  </Button>
                </div>
              </section>

              <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-400 font-medium" onClick={handleSaveEdit} data-testid="button-save-edit">
                Save Changes
              </Button>

              <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
                <Label className="text-yellow-300">Words ({editListWords.filter(w => w.trim()).length})</Label>
                <div className="space-y-2">
                  {editListWords.map((word, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={word}
                        onChange={e => handleUpdateWord(index, e.target.value)}
                        placeholder={`Word ${index + 1}`}
                        data-testid={`input-word-${index}`}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveWord(index)}
                        data-testid={`button-remove-word-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
