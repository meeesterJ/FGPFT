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
  selectedListIds: string[];
  customLists: WordList[];
  
  // Game Session
  currentRound: number;
  currentScore: number;
  totalScore: number;
  roundWords: string[]; // Words processed in current round
  currentWord: string | null;
  deck: string[]; // Remaining words to guess
  isPlaying: boolean;
  isRoundOver: boolean;
  isGameFinished: boolean;
  roundResults: { word: string; correct: boolean }[]; // Track history of current round

  // Actions
  setRoundDuration: (seconds: number) => void;
  setTotalRounds: (rounds: number) => void;
  toggleListSelection: (id: string) => void;
  addCustomList: (list: WordList) => void;
  removeCustomList: (id: string) => void;
  updateCustomList: (id: string, updatedList: WordList) => void;
  
  startGame: () => void;
  startRound: () => void;
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
      selectedListIds: ['movies'],
      customLists: [],
      
      currentRound: 0,
      currentScore: 0,
      totalScore: 0,
      roundWords: [],
      currentWord: null,
      deck: [],
      isPlaying: false,
      isRoundOver: false,
      isGameFinished: false,
      roundResults: [],

      setRoundDuration: (seconds) => set({ roundDuration: seconds }),
      setTotalRounds: (rounds) => set({ totalRounds: rounds }),
      
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

      startGame: () => {
        set({
          currentRound: 0,
          totalScore: 0,
          isGameFinished: false,
          isRoundOver: true, // Start in "ready for round 1" state
          isPlaying: false
        });
        get().startRound(); // Actually, let's just prep round 1
      },

      startRound: () => {
        const { currentRound, totalRounds, selectedListIds, customLists } = get();
        
        if (currentRound >= totalRounds) {
          set({ isGameFinished: true, isPlaying: false });
          return;
        }

        // Compile deck
        const allLists = [...DEFAULT_WORD_LISTS, ...customLists];
        const activeLists = allLists.filter(l => selectedListIds.includes(l.id));
        let words = activeLists.flatMap(l => l.words);
        
        // Shuffle words
        words = words.sort(() => Math.random() - 0.5);

        set({
          currentRound: currentRound + 1,
          currentScore: 0,
          roundResults: [],
          deck: words,
          currentWord: words[0] || "No Words!",
          isPlaying: true,
          isRoundOver: false
        });
      },

      nextWord: (correct) => {
        const { deck, currentWord, roundResults, currentScore } = get();
        if (!currentWord) return;

        const newResults = [...roundResults, { word: currentWord, correct }];
        const newScore = correct ? currentScore + 1 : currentScore;
        const newDeck = deck.slice(1);
        
        // If deck runs out, recycle? Or just end round?
        // Let's recycle for endless play within timer
        let nextWordStr = newDeck[0];
        let finalDeck = newDeck;

        if (newDeck.length === 0) {
           // Refill if empty
           const allLists = [...DEFAULT_WORD_LISTS, ...get().customLists];
           const activeLists = allLists.filter(l => get().selectedListIds.includes(l.id));
           let words = activeLists.flatMap(l => l.words).sort(() => Math.random() - 0.5);
           nextWordStr = words[0];
           finalDeck = words;
        }

        set({
          currentScore: newScore,
          roundResults: newResults,
          deck: finalDeck,
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
        selectedListIds: state.selectedListIds,
        customLists: state.customLists
      }),
    }
  )
);
