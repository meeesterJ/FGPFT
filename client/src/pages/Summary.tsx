import { useLocation } from "wouter";
import { useGameStore, TEAM_THEME_COLORS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, Home, Trophy, ListX, CheckCircle2, Crown, X } from "lucide-react";
import { menuButtonStyles } from "@/components/ui/game-ui";
import Confetti from "react-confetti";
import { useState, useEffect, useRef, useMemo } from 'react';
import { playSound, stopSound } from "@/lib/audio";
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
  const store = useGameStore();
  const { width, height } = useWindowSize();
  const hasPlayedGameEndSound = useRef(false);
  const hasPlayedDrumroll = useRef(false);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);
  const isLandscape = useIsLandscape();

  const isLastRound = store.currentRound >= store.totalRounds && !store.isGameFinished;

  const scores = store.isGameFinished ? store.teamTotalScores : store.teamRoundScores;

  const winnerInfo = useMemo(() => {
    if (scores.length === 0 || store.numberOfTeams <= 1) return null;
    const maxCorrect = Math.max(...scores.map(s => s.correct));
    if (maxCorrect === 0) return null;
    const winners = scores.map((s, i) => ({ team: i + 1, correct: s.correct })).filter(t => t.correct === maxCorrect);
    return { isTie: winners.length > 1, winnerTeam: winners[0].team, maxCorrect };
  }, [scores, store.numberOfTeams]);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape-primary');
        }
      } catch (e) {
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape');
          }
        } catch (e2) {}
      }
    };
    lockOrientation();
  }, []);

  useEffect(() => {
    if (store.isGameFinished && !hasPlayedGameEndSound.current) {
      hasPlayedGameEndSound.current = true;
      if (store.soundEnabled) {
        playSound('gameEnd', store.soundVolume);
        playSound('applause', store.soundVolume);
      }
    }
  }, [store.isGameFinished, store.soundEnabled, store.soundVolume]);

  useEffect(() => {
    if (isLastRound && !hasPlayedDrumroll.current) {
      hasPlayedDrumroll.current = true;
      if (store.soundEnabled) {
        playSound('drumroll', store.soundVolume);
      }
    }
  }, [isLastRound, store.soundEnabled, store.soundVolume]);

  const handleNext = () => {
    if (store.isGameFinished) {
      store.startGame();
      setLocation("/game");
    } else if (isLastRound) {
      stopSound('drumroll');
      store.prepareRound();
    } else {
      store.prepareRound();
      setLocation("/game");
    }
  };

  const handleHome = () => {
    stopSound('drumroll');
    store.resetGame();
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {}
    setLocation("/");
  };

  const wordResults = selectedTeamIndex !== null
    ? (store.isGameFinished ? store.teamGameResults[selectedTeamIndex] : store.teamRoundResults[selectedTeamIndex]) || []
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
    <div className="h-[100dvh] bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {store.isGameFinished && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
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
                const teamName = store.getTeamName(i + 1);
                const isWinner = winnerInfo && !winnerInfo.isTie && score.correct === winnerInfo.maxCorrect && store.numberOfTeams > 1;
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
                        {store.numberOfTeams > 1 ? teamName : 'Score'}
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
                    {winnerInfo.isTie ? 'Tie!' : `${store.getTeamName(winnerInfo.winnerTeam)}!`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Header + Button */}
        <div className="flex flex-col justify-center items-center gap-6 min-w-[10rem]">
          {store.isGameFinished ? (
            <div className="flex flex-col items-center animate-bounce-in">
              <h1 className="text-6xl font-thin tracking-wide transform -rotate-2 leading-tight text-center" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                <span className="text-yellow-400">Game</span>
                <br />
                <span className="text-yellow-400">Over!</span>
              </h1>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-bounce-in">
              <h1 className="text-5xl font-thin tracking-wide transform -rotate-2 leading-none">
                <span className="text-pink-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>R</span>
                <span className="text-cyan-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>o</span>
                <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>u</span>
                <span className="text-green-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>n</span>
                <span className="text-purple-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>d</span>
              </h1>
              <span className="text-7xl font-thin text-yellow-400 leading-none mt-2" style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>{store.currentRound}</span>
              <span className="text-base text-muted-foreground uppercase tracking-widest mt-2">Complete</span>
            </div>
          )}
          <Button 
            size="lg" 
            className={`${menuButtonStyles.pink} h-12`}
            onClick={handleNext}
            data-testid="button-next"
          >
            {store.isGameFinished ? (
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

      {/* Word List Popup */}
      {selectedTeamIndex !== null && (() => {
        const popupColor = TEAM_THEME_COLORS[selectedTeamIndex % TEAM_THEME_COLORS.length];
        const popupTeamName = store.getTeamName(selectedTeamIndex + 1);
        return (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTeamIndex(null)}>
            <div className={`bg-card rounded-2xl border ${popupColor.border} shadow-2xl w-full max-w-xs max-h-[80vh] flex flex-col m-4`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className={`font-bold text-lg ${popupColor.text} truncate`}>
                  {store.numberOfTeams > 1 ? popupTeamName : 'Words'} — {store.isGameFinished ? 'All Rounds' : `Round ${store.currentRound}`}
                </h3>
                <button onClick={() => setSelectedTeamIndex(null)} className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0" data-testid="button-close-popup">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {wordResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                    <span className="font-medium text-sm">{res.word}</span>
                    {res.correct ? (
                      <CheckCircle2 className="text-green-400 w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ListX className="text-red-400 w-5 h-5 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {wordResults.length === 0 && (
                  <p className="text-muted-foreground italic text-sm text-center py-4">No words played yet.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
