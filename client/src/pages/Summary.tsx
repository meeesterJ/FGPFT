import { useLocation } from "wouter";
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, TEAM_THEME_COLORS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, ArrowLeft, Home, Trophy, ListX, CheckCircle2, Crown, X } from "lucide-react";
import { menuButtonStyles, RainbowText } from "@/components/ui/game-ui";
import Confetti from "react-confetti";
import { useState, useEffect, useRef, useMemo } from 'react';
import { playSound, stopSound } from "@/lib/audio";
import { lockToLandscape, unlockOrientation } from "@/lib/orientation";
import { useIsLandscape } from "@/hooks/use-landscape";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

export default function Summary() {
  const [, setLocation] = useLocation();
  const {
    currentRound, totalRounds, isGameFinished, numberOfTeams,
    soundEnabled, soundVolume, teamTotalScores, teamRoundScores,
    teamRoundResults, teamGameResults,
    startGame, prepareRound, resetGame, getTeamName,
  } = useGameStore(useShallow(s => ({
    currentRound: s.currentRound,
    totalRounds: s.totalRounds,
    isGameFinished: s.isGameFinished,
    numberOfTeams: s.numberOfTeams,
    soundEnabled: s.soundEnabled,
    soundVolume: s.soundVolume,
    teamTotalScores: s.teamTotalScores,
    teamRoundScores: s.teamRoundScores,
    teamRoundResults: s.teamRoundResults,
    teamGameResults: s.teamGameResults,
    startGame: s.startGame,
    prepareRound: s.prepareRound,
    resetGame: s.resetGame,
    getTeamName: s.getTeamName,
  })));
  const { width, height } = useWindowSize();
  const hasPlayedGameEndSound = useRef(false);
  const hasPlayedDrumroll = useRef(false);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);
  const isLandscape = useIsLandscape();

  const isLastRound = currentRound >= totalRounds && !isGameFinished;

  const scores = isGameFinished ? teamTotalScores : teamRoundScores;

  const winnerInfo = useMemo(() => {
    if (scores.length === 0 || numberOfTeams <= 1) return null;
    const maxCorrect = Math.max(...scores.map(s => s.correct));
    if (maxCorrect === 0) return null;
    const winners = scores.map((s, i) => ({ team: i + 1, correct: s.correct })).filter(t => t.correct === maxCorrect);
    return { isTie: winners.length > 1, winnerTeam: winners[0].team, maxCorrect };
  }, [scores, numberOfTeams]);

  useEffect(() => {
    lockToLandscape();
  }, []);

  useEffect(() => {
    if (isGameFinished && !hasPlayedGameEndSound.current) {
      hasPlayedGameEndSound.current = true;
      if (soundEnabled) {
        playSound('gameEnd', soundVolume);
        playSound('applause', soundVolume);
      }
    }
  }, [isGameFinished, soundEnabled, soundVolume]);

  useEffect(() => {
    if (isLastRound && !hasPlayedDrumroll.current) {
      hasPlayedDrumroll.current = true;
      if (soundEnabled) {
        playSound('drumroll', soundVolume);
      }
    }
  }, [isLastRound, soundEnabled, soundVolume]);

  const handleNext = () => {
    if (isGameFinished) {
      startGame();
      setLocation("/game");
    } else if (isLastRound) {
      stopSound('drumroll');
      prepareRound();
    } else {
      prepareRound();
      setLocation("/game");
    }
  };

  const handleHome = () => {
    stopSound('drumroll');
    resetGame();
    unlockOrientation();
    setLocation("/");
  };

  const wordResults = selectedTeamIndex !== null
    ? (isGameFinished ? teamGameResults[selectedTeamIndex] : teamRoundResults[selectedTeamIndex]) || []
    : [];

  if (!isLandscape) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center space-y-6 p-8">
        <RotateCcw className="w-24 h-24 text-primary animate-spin" style={{ animationDuration: '3s' }} />
        <h2 className="text-3xl font-black text-primary text-center">Please Rotate Your Device</h2>
        <p className="text-muted-foreground text-center text-lg">Turn your phone sideways to view results</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex items-center justify-center p-4 relative overflow-hidden safe-area-x">
      {isGameFinished && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <button 
        onClick={handleHome}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-card/80 hover:bg-card border border-border shadow-lg hover:scale-110 transition-transform"
        data-testid="button-home"
      >
        <Home className="w-6 h-6 text-foreground" />
      </button>
      
      <div className="w-full h-full max-h-full z-10 flex flex-row gap-4">
        {/* Left side: Scoreboard */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="space-y-3 animate-bounce-in w-full max-w-sm">
            <div className="space-y-2">
              {scores.map((score, i) => {
                const color = TEAM_THEME_COLORS[i % TEAM_THEME_COLORS.length];
                const teamName = getTeamName(i + 1);
                const isWinner = winnerInfo && !winnerInfo.isTie && score.correct === winnerInfo.maxCorrect && numberOfTeams > 1;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedTeamIndex(i)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl ${color.bg} border ${color.border} ${isWinner ? 'ring-2 ring-yellow-400/50' : ''} hover:brightness-125 active:scale-[0.98] transition-all cursor-pointer`}
                    data-testid={`team-score-${i + 1}`}
                  >
                    <div className="flex items-center gap-2">
                      {isWinner && <Crown className="w-5 h-5 text-yellow-400" />}
                      <span className={`font-bold text-lg ${color.text} truncate max-w-[8rem]`}>
                        {numberOfTeams > 1 ? teamName : 'Score'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="font-mono text-lg text-green-400">{score.correct}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ListX className="w-4 h-4 text-red-400" />
                        <span className="font-mono text-lg text-red-400">{score.passed}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {winnerInfo && (
              <div className="mt-4 p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-yellow-400">
                    {winnerInfo.isTie ? 'Tie!' : `${getTeamName(winnerInfo.winnerTeam)}!`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Header + Button */}
        <div className="flex flex-col justify-center items-center gap-6 min-w-[10rem]">
          {isGameFinished ? (
            <div className="flex flex-col items-center animate-bounce-in">
              <h1 className="text-6xl font-thin tracking-wide transform -rotate-2 leading-tight text-center text-shadow-md">
                <span className="text-yellow-400">Game</span>
                <br />
                <span className="text-yellow-400">Over!</span>
              </h1>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-bounce-in">
              <h1 className="text-5xl font-thin tracking-wide transform -rotate-2 leading-none">
                <RainbowText text="Round" />
              </h1>
              <span className="text-7xl font-thin text-yellow-400 leading-none mt-2 font-display text-shadow-md">{currentRound}</span>
              <span className="text-base text-muted-foreground uppercase tracking-widest mt-2">Complete</span>
            </div>
          )}
          <Button 
            size="lg" 
            className={`${menuButtonStyles.pink} h-12`}
            onClick={handleNext}
            data-testid="button-next"
          >
            {isGameFinished ? (
              <>
                <RotateCcw className="mr-2 w-5 h-5" /> Play Again
              </>
            ) : isLastRound ? (
              <>
                And the Winner Is... <Trophy className="ml-2 w-5 h-5" />
              </>
            ) : (
              <>
                Next Round <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Word List - Full Screen */}
      {selectedTeamIndex !== null && (() => {
        const popupColor = TEAM_THEME_COLORS[selectedTeamIndex % TEAM_THEME_COLORS.length];
        const popupTeamName = getTeamName(selectedTeamIndex + 1);
        const title = numberOfTeams > 1 ? popupTeamName : 'Words';
        const subtitle = isGameFinished ? 'All Rounds' : `Round ${currentRound}`;
        return (
          <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-card flex flex-col">
            <header className={`p-4 flex items-center border-b ${popupColor.border} backdrop-blur-md`}>
              <Button variant="ghost" size="icon" className={`${popupColor.text} hover:bg-muted`} onClick={() => setSelectedTeamIndex(null)} data-testid="button-close-popup">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className={`text-2xl font-thin ml-4 ${popupColor.text}`}>{title} — {subtitle}</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-2">
                {wordResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border" data-testid={`word-result-${i}`}>
                    <span className="font-medium">{res.word}</span>
                    {res.correct ? (
                      <CheckCircle2 className="text-green-400 w-6 h-6 flex-shrink-0" />
                    ) : (
                      <ListX className="text-red-400 w-6 h-6 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {wordResults.length === 0 && (
                  <p className="text-muted-foreground italic text-center py-8">No words played yet.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
