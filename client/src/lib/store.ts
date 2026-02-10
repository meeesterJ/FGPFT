import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WORD_LISTS } from './words';

export type WordList = {
  id: string;
  name: string;
  words: string[];
  isCustom?: boolean;
};

export type TeamScore = {
  correct: number;
  passed: number;
};

export const TEAM_THEME_COLORS = [
  { name: 'pink', text: 'text-pink-400', bg: 'bg-pink-500/20', bgSolid: '#831843', border: 'border-pink-500/30', accent: 'text-pink-300' },
  { name: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500/20', bgSolid: '#164e63', border: 'border-cyan-500/30', accent: 'text-cyan-300' },
  { name: 'purple', text: 'text-purple-400', bg: 'bg-purple-500/20', bgSolid: '#581c87', border: 'border-purple-500/30', accent: 'text-purple-300' },
  { name: 'green', text: 'text-green-400', bg: 'bg-green-500/20', bgSolid: '#14532d', border: 'border-green-500/30', accent: 'text-green-300' },
  { name: 'yellow', text: 'text-yellow-400', bg: 'bg-yellow-500/20', bgSolid: '#713f12', border: 'border-yellow-500/30', accent: 'text-yellow-300' },
];

export const MAX_TEAM_NAME_LENGTH = 12;

function defaultTeamNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
}

interface GameState {
  // Settings
  roundDuration: number;
  totalRounds: number;
  showButtons: boolean;
  hapticEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  tiltPermissionGranted: boolean;
  splashDismissed: boolean;
  selectedListIds: string[];
  customLists: WordList[];
  builtInListOverrides: Record<string, { name?: string; words?: string[] }>;
  deletedBuiltInLists: string[];
  permanentlyDeletedBuiltInLists: string[];
  numberOfTeams: number;
  teamNames: string[];
  
  // Game Session
  currentRound: number;
  currentScore: number;
  currentWord: string | null;
  deck: string[];
  usedWords: string[];
  isPlaying: boolean;
  isRoundOver: boolean;
  isGameFinished: boolean;
  roundResults: { word: string; correct: boolean }[];
  currentTeam: number;
  teamRoundScores: TeamScore[];
  teamTotalScores: TeamScore[];
  teamRoundResults: { word: string; correct: boolean }[][];
  teamGameResults: { word: string; correct: boolean }[][];

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
  setNumberOfTeams: (count: number) => void;
  setTeamName: (index: number, name: string) => void;
  getTeamName: (teamNumber: number) => string;
  getTeamColor: (teamNumber: number) => typeof TEAM_THEME_COLORS[0];
  
  startGame: () => void;
  prepareRound: () => void;
  beginRound: () => void;
  nextWord: (correct: boolean) => void;
  endRound: () => void;
  isAllTeamsPlayed: () => boolean;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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
      numberOfTeams: 1,
      teamNames: defaultTeamNames(1),
      
      currentRound: 0,
      currentScore: 0,
      currentWord: null,
      deck: [],
      usedWords: [],
      isPlaying: false,
      isRoundOver: false,
      isGameFinished: false,
      roundResults: [],
      currentTeam: 1,
      teamRoundScores: [],
      teamTotalScores: [],
      teamRoundResults: [],
      teamGameResults: [],

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
          if (state.selectedListIds.length <= 1) return state;
          return { selectedListIds: state.selectedListIds.filter(lid => lid !== id) };
        }
        return { selectedListIds: [...state.selectedListIds, id] };
      }),

      addCustomList: (list) => set((state) => ({ 
        customLists: [...state.customLists, list],
        selectedListIds: [...state.selectedListIds, list.id]
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

      setNumberOfTeams: (count) => set((state) => {
        const newNames = Array.from({ length: count }, (_, i) => {
          return state.teamNames[i] || `Team ${i + 1}`;
        });
        return { numberOfTeams: count, teamNames: newNames };
      }),

      setTeamName: (index, name) => set((state) => {
        const trimmed = name.slice(0, MAX_TEAM_NAME_LENGTH);
        const newNames = [...state.teamNames];
        newNames[index] = trimmed;
        return { teamNames: newNames };
      }),

      getTeamName: (teamNumber) => {
        const { teamNames } = get();
        return teamNames[teamNumber - 1] || `Team ${teamNumber}`;
      },

      getTeamColor: (teamNumber) => {
        return TEAM_THEME_COLORS[(teamNumber - 1) % TEAM_THEME_COLORS.length];
      },

      startGame: () => {
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
          const animalsEasy = allAvailableLists.find(l => l.id === 'animals-easy');
          const defaultList = animalsEasy || allAvailableLists[0];
          activeListIds = [defaultList.id];
          set({ selectedListIds: activeListIds });
        }
        
        const activeLists = allAvailableLists.filter(l => activeListIds.includes(l.id));
        const allWords = activeLists.flatMap(l => l.words).sort(() => Math.random() - 0.5);
        
        const { numberOfTeams } = get();
        const emptyScores = () => Array.from({ length: numberOfTeams }, () => ({ correct: 0, passed: 0 }));
        const emptyResults = () => Array.from({ length: numberOfTeams }, (): { word: string; correct: boolean }[] => []);
        
        set({
          currentRound: 0,
          deck: allWords,
          usedWords: [],
          isGameFinished: false,
          isRoundOver: true,
          isPlaying: false,
          currentTeam: 0,
          teamRoundScores: emptyScores(),
          teamTotalScores: emptyScores(),
          teamRoundResults: emptyResults(),
          teamGameResults: emptyResults(),
        });
        get().prepareRound();
      },

      prepareRound: () => {
        const { currentRound, totalRounds, deck, numberOfTeams, currentTeam } = get();
        
        const allTeamsPlayed = currentTeam >= numberOfTeams;
        
        if (!allTeamsPlayed && currentTeam > 0) {
          set({
            currentTeam: currentTeam + 1,
            currentScore: 0,
            roundResults: [],
            currentWord: deck[0] || "No Words!",
            isPlaying: false,
            isRoundOver: false
          });
          return;
        }
        
        if (allTeamsPlayed && currentRound >= totalRounds) {
          set({ isGameFinished: true, isPlaying: false });
          return;
        }

        set({
          currentRound: currentRound + 1,
          currentTeam: 1,
          currentScore: 0,
          roundResults: [],
          teamRoundScores: Array.from({ length: numberOfTeams }, () => ({ correct: 0, passed: 0 })),
          teamRoundResults: Array.from({ length: numberOfTeams }, (): { word: string; correct: boolean }[] => []),
          currentWord: deck[0] || "No Words!",
          isPlaying: false,
          isRoundOver: false
        });
      },

      beginRound: () => {
        set({ isPlaying: true });
      },

      nextWord: (correct) => {
        const { deck, currentWord, roundResults, currentScore, usedWords, currentTeam, teamRoundResults } = get();
        if (!currentWord) return;

        const entry = { word: currentWord, correct };
        const newResults = [...roundResults, entry];
        const newScore = correct ? currentScore + 1 : currentScore;
        const newUsedWords = [...usedWords, currentWord];
        const newDeck = deck.slice(1);
        
        let nextWordStr = newDeck[0];
        let finalDeck = newDeck;
        let finalUsedWords = newUsedWords;

        if (newDeck.length === 0) {
           const reshuffled = [...newUsedWords].sort(() => Math.random() - 0.5);
           nextWordStr = reshuffled[0];
           finalDeck = reshuffled;
           finalUsedWords = [];
        }

        const teamIndex = currentTeam - 1;
        const newTeamRoundResults = [...teamRoundResults];
        newTeamRoundResults[teamIndex] = [...(newTeamRoundResults[teamIndex] || []), entry];

        set({
          currentScore: newScore,
          roundResults: newResults,
          deck: finalDeck,
          usedWords: finalUsedWords,
          currentWord: nextWordStr,
          teamRoundResults: newTeamRoundResults,
        });
      },

      endRound: () => {
        const { currentTeam, numberOfTeams, teamRoundScores, teamTotalScores, roundResults, teamGameResults } = get();
        
        const correct = roundResults.filter(r => r.correct).length;
        const passed = roundResults.filter(r => !r.correct).length;
        const teamIndex = currentTeam - 1;
        
        const newRoundScores = [...teamRoundScores];
        newRoundScores[teamIndex] = { correct, passed };
        
        const newTotalScores = [...teamTotalScores];
        newTotalScores[teamIndex] = {
          correct: newTotalScores[teamIndex].correct + correct,
          passed: newTotalScores[teamIndex].passed + passed
        };
        
        const newTeamGameResults = [...teamGameResults];
        newTeamGameResults[teamIndex] = [...(newTeamGameResults[teamIndex] || []), ...roundResults];
        
        set({
          isPlaying: false,
          isRoundOver: false,
          teamRoundScores: newRoundScores,
          teamTotalScores: newTotalScores,
          teamGameResults: newTeamGameResults,
        });
      },

      isAllTeamsPlayed: () => {
        const { currentTeam, numberOfTeams } = get();
        return currentTeam >= numberOfTeams;
      },

      resetGame: () => {
        set({
          currentRound: 0,
          currentScore: 0,
          deck: [],
          usedWords: [],
          isPlaying: false,
          isRoundOver: false,
          isGameFinished: false,
          currentTeam: 1,
          teamRoundScores: [],
          teamTotalScores: [],
          teamRoundResults: [],
          teamGameResults: [],
        });
      }
    }),
    {
      name: 'guess-party-storage',
      version: 3,
      partialize: (state) => ({ 
        roundDuration: state.roundDuration,
        totalRounds: state.totalRounds,
        showButtons: state.showButtons,
        numberOfTeams: state.numberOfTeams,
        teamNames: state.teamNames,
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
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          delete persistedState.teamMode;
          if (!persistedState.numberOfTeams) {
            persistedState.numberOfTeams = 1;
          }
        }
        if (version < 3) {
          const count = persistedState.numberOfTeams || 1;
          persistedState.teamNames = defaultTeamNames(count);
        }
        return persistedState;
      },
    }
  )
);
