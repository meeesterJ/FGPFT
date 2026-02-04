import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WORD_LISTS } from './words';

export type WordList = {
  id: string;
  name: string;
  words: string[];
  isCustom?: boolean;
};

interface GameState {
  // Settings
  roundDuration: number; // in seconds
  totalRounds: number;
  showButtons: boolean; // Show/hide Correct/Pass buttons during gameplay
  hapticEnabled: boolean; // Enable haptic vibration feedback
  soundEnabled: boolean; // Enable sound feedback
  soundVolume: number; // Sound volume 0-100
  tiltPermissionGranted: boolean; // iOS device orientation permission granted
  splashDismissed: boolean; // Track if splash screen has been dismissed this session
  selectedListIds: string[];
  customLists: WordList[];
  builtInListOverrides: Record<string, { name?: string; words?: string[] }>; // Edits to built-in lists
  deletedBuiltInLists: string[]; // Track deleted built-in lists
  permanentlyDeletedBuiltInLists: string[]; // Track permanently deleted built-in lists
  
  // Game Session
  currentRound: number;
  currentScore: number;
  totalScore: number;
  roundWords: string[]; // Words processed in current round
  currentWord: string | null;
  deck: string[]; // Remaining words to guess in current game
  usedWords: string[]; // Words already shown in this game (for no-repeat until exhausted)
  isPlaying: boolean;
  isRoundOver: boolean;
  isGameFinished: boolean;
  roundResults: { word: string; correct: boolean }[]; // Track history of current round

  // Actions
  setRoundDuration: (seconds: number) => void;
  setTotalRounds: (rounds: number) => void;
  setShowButtons: (show: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setTiltPermissionGranted: (granted: boolean) => void;
  setSplashDismissed: (dismissed: boolean) => void;
  toggleListSelection: (id: string) => void;
  addCustomList: (list: WordList) => void;
  removeCustomList: (id: string) => void;
  updateCustomList: (id: string, updatedList: WordList) => void;
  updateBuiltInList: (id: string, name: string, words: string[]) => void;
  resetBuiltInList: (id: string) => void;
  deleteBuiltInList: (id: string) => void;
  restoreBuiltInList: (id: string) => void;
  permanentlyDeleteBuiltInList: (id: string) => void;
  getEffectiveBuiltInLists: () => WordList[];
  
  startGame: () => void;
  prepareRound: () => void;  // Set up deck/word, isPlaying stays false
  beginRound: () => void;    // Set isPlaying=true after countdown
  startRound: () => void;    // Legacy: prepareRound + beginRound
  nextWord: (correct: boolean) => void;
  endRound: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Defaults
      roundDuration: 30,
      totalRounds: 3,
      showButtons: false,
      hapticEnabled: true,
      soundEnabled: true,
      soundVolume: 100,
      tiltPermissionGranted: false,
      splashDismissed: false,
      selectedListIds: ['animals-easy'],
      customLists: [],
      builtInListOverrides: {},
      deletedBuiltInLists: [],
      permanentlyDeletedBuiltInLists: [],
      
      currentRound: 0,
      currentScore: 0,
      totalScore: 0,
      roundWords: [],
      currentWord: null,
      deck: [],
      usedWords: [],
      isPlaying: false,
      isRoundOver: false,
      isGameFinished: false,
      roundResults: [],

      setRoundDuration: (seconds) => set({ roundDuration: seconds }),
      setTotalRounds: (rounds) => set({ totalRounds: rounds }),
      setShowButtons: (show) => set({ showButtons: show }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setTiltPermissionGranted: (granted) => set({ tiltPermissionGranted: granted }),
      setSplashDismissed: (dismissed) => set({ splashDismissed: dismissed }),
      
      toggleListSelection: (id) => set((state) => {
        const exists = state.selectedListIds.includes(id);
        if (exists) {
          // Prevent deselecting the last list
          if (state.selectedListIds.length <= 1) return state;
          return { selectedListIds: state.selectedListIds.filter(lid => lid !== id) };
        }
        return { selectedListIds: [...state.selectedListIds, id] };
      }),

      addCustomList: (list) => set((state) => ({ 
        customLists: [...state.customLists, list],
        selectedListIds: [...state.selectedListIds, list.id] // Auto-select new list
      })),

      removeCustomList: (id) => set((state) => ({
        customLists: state.customLists.filter(l => l.id !== id),
        selectedListIds: state.selectedListIds.filter(lid => lid !== id)
      })),

      updateCustomList: (id, updatedList) => set((state) => ({
        customLists: state.customLists.map(l => l.id === id ? updatedList : l)
      })),

      updateBuiltInList: (id, name, words) => set((state) => ({
        builtInListOverrides: {
          ...state.builtInListOverrides,
          [id]: { name, words }
        }
      })),

      resetBuiltInList: (id) => set((state) => {
        const { [id]: _, ...rest } = state.builtInListOverrides;
        return { builtInListOverrides: rest };
      }),

      getEffectiveBuiltInLists: () => {
        const state = get();
        return DEFAULT_WORD_LISTS.map(list => {
          const override = state.builtInListOverrides[list.id];
          if (override) {
            return {
              ...list,
              name: override.name ?? list.name,
              words: override.words ?? list.words
            };
          }
          return list;
        });
      },

      deleteBuiltInList: (id) => set((state) => ({
        deletedBuiltInLists: [...state.deletedBuiltInLists, id],
        selectedListIds: state.selectedListIds.filter(lid => lid !== id)
      })),

      restoreBuiltInList: (id) => set((state) => ({
        deletedBuiltInLists: state.deletedBuiltInLists.filter(did => did !== id)
      })),

      permanentlyDeleteBuiltInList: (id) => set((state) => ({
        deletedBuiltInLists: state.deletedBuiltInLists.filter(did => did !== id),
        permanentlyDeletedBuiltInLists: [...state.permanentlyDeletedBuiltInLists, id]
      })),

      startGame: () => {
        // Ensure at least one category is selected, default to first available if none
        const { selectedListIds, deletedBuiltInLists, permanentlyDeletedBuiltInLists, customLists } = get();
        const effectiveBuiltInLists = get().getEffectiveBuiltInLists();
        const allAvailableLists = [
          ...effectiveBuiltInLists.filter(l => 
            !deletedBuiltInLists.includes(l.id) && 
            !permanentlyDeletedBuiltInLists.includes(l.id)
          ),
          ...customLists
        ];
        let activeListIds = selectedListIds.filter(id => 
          allAvailableLists.some(l => l.id === id)
        );
        
        if (activeListIds.length === 0 && allAvailableLists.length > 0) {
          // Default to first available list if no valid categories selected
          const animalsEasy = allAvailableLists.find(l => l.id === 'animals-easy');
          const defaultList = animalsEasy || allAvailableLists[0];
          activeListIds = [defaultList.id];
          set({ selectedListIds: activeListIds });
        }
        
        // Build the master deck for this game session (shuffled once)
        const activeLists = allAvailableLists.filter(l => activeListIds.includes(l.id));
        const allWords = activeLists.flatMap(l => l.words).sort(() => Math.random() - 0.5);
        
        set({
          currentRound: 0,
          totalScore: 0,
          deck: allWords,
          usedWords: [],
          isGameFinished: false,
          isRoundOver: true,
          isPlaying: false
        });
        get().prepareRound();
      },

      // Set up for next round WITHOUT rebuilding deck - uses existing game deck
      prepareRound: () => {
        const { currentRound, totalRounds, deck } = get();
        
        if (currentRound >= totalRounds) {
          set({ isGameFinished: true, isPlaying: false });
          return;
        }

        set({
          currentRound: currentRound + 1,
          currentScore: 0,
          roundResults: [],
          currentWord: deck[0] || "No Words!",
          isPlaying: false,
          isRoundOver: false
        });
      },

      // Start playing - called after countdown completes
      beginRound: () => {
        set({ isPlaying: true });
      },

      // Legacy: calls prepareRound + beginRound (for Summary.tsx compatibility)
      startRound: () => {
        get().prepareRound();
        get().beginRound();
      },

      nextWord: (correct) => {
        const { deck, currentWord, roundResults, currentScore, usedWords } = get();
        if (!currentWord) return;

        const newResults = [...roundResults, { word: currentWord, correct }];
        const newScore = correct ? currentScore + 1 : currentScore;
        const newUsedWords = [...usedWords, currentWord];
        const newDeck = deck.slice(1);
        
        let nextWordStr = newDeck[0];
        let finalDeck = newDeck;
        let finalUsedWords = newUsedWords;

        if (newDeck.length === 0) {
           // All words exhausted - reshuffle used words back into deck
           const reshuffled = [...newUsedWords].sort(() => Math.random() - 0.5);
           nextWordStr = reshuffled[0];
           finalDeck = reshuffled;
           finalUsedWords = []; // Reset used words after reshuffle
        }

        set({
          currentScore: newScore,
          roundResults: newResults,
          deck: finalDeck,
          usedWords: finalUsedWords,
          currentWord: nextWordStr
        });
      },

      endRound: () => {
        const { currentScore, totalScore } = get();
        set({
          isPlaying: false,
          isRoundOver: true,
          totalScore: totalScore + currentScore
        });
      },

      resetGame: () => {
        set({
          currentRound: 0,
          currentScore: 0,
          totalScore: 0,
          deck: [],
          usedWords: [],
          isPlaying: false,
          isRoundOver: false,
          isGameFinished: false
        });
      }
    }),
    {
      name: 'guess-party-storage',
      partialize: (state) => ({ 
        roundDuration: state.roundDuration,
        totalRounds: state.totalRounds,
        showButtons: state.showButtons,
        hapticEnabled: state.hapticEnabled,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        tiltPermissionGranted: state.tiltPermissionGranted,
        selectedListIds: state.selectedListIds,
        customLists: state.customLists,
        builtInListOverrides: state.builtInListOverrides,
        deletedBuiltInLists: state.deletedBuiltInLists,
        permanentlyDeletedBuiltInLists: state.permanentlyDeletedBuiltInLists
      }),
    }
  )
);
