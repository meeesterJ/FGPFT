import { useLocation } from "wouter";
import { useGameStore, type TeamScore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, Home, Trophy, ListX, CheckCircle2, Crown } from "lucide-react";
import { menuButtonStyles } from "@/components/ui/game-ui";
import Confetti from "react-confetti";
import { useState, useEffect, useRef } from 'react';
import { playSound, stopSound } from "@/lib/audio";

const TEAM_COLORS = [
  { text: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
  { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
];

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

  const isLastRound = store.currentRound >= store.totalRounds && !store.isGameFinished;

  // Play game end sound + applause when game is finished
  useEffect(() => {
    if (store.isGameFinished && !hasPlayedGameEndSound.current) {
      hasPlayedGameEndSound.current = true;
      if (store.soundEnabled) {
        playSound('gameEnd', store.soundVolume);
        playSound('applause', store.soundVolume);
      }
    }
  }, [store.isGameFinished, store.soundEnabled, store.soundVolume]);

  // Play drumroll when showing "And the Winner Is..." button
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
      // Start a new game immediately with current settings
      store.startGame();
      setLocation("/game");
    } else if (isLastRound) {
      // Stop the drumroll when clicking "And the Winner Is..."
      stopSound('drumroll');
      // This is the final round - calling prepareRound will set isGameFinished=true
      // Stay on this page to show the final scoreboard
      store.prepareRound();
      // Page will re-render with isGameFinished=true, showing confetti and total score
    } else {
      store.prepareRound(); // Prep next round, Game.tsx will call beginRound after countdown
      setLocation("/game");
    }
  };

  const handleHome = () => {
    stopSound('drumroll'); // Stop drumroll if playing
    store.resetGame();
    setLocation("/");
  };

  return (
    <div className="h-[100dvh] bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {store.isGameFinished && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      {/* Home icon in top left corner */}
      <button 
        onClick={handleHome}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-card/80 hover:bg-card border border-border shadow-lg hover:scale-110 transition-transform"
        data-testid="button-home"
      >
        <Home className="w-6 h-6 text-foreground" />
      </button>
      
      <div className="w-full h-full max-h-full z-10 flex flex-row gap-4">
        
        {store.teamMode ? (
          <>
            {/* Team Mode Layout - Left side: Scoreboard */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="space-y-3 animate-bounce-in w-full max-w-sm">
                {/* Team Scoreboard */}
                <div className="space-y-2">
                  {(store.isGameFinished ? store.teamTotalScores : store.teamRoundScores).map((score, i) => {
                    const scores = store.isGameFinished ? store.teamTotalScores : store.teamRoundScores;
                    const maxCorrect = scores.length > 0 ? Math.max(...scores.map(s => s.correct)) : 0;
                    const isWinner = score.correct === maxCorrect && maxCorrect > 0;
                    const color = TEAM_COLORS[i % TEAM_COLORS.length];
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${color.bg} border ${color.border} ${isWinner ? 'ring-2 ring-yellow-400/50' : ''}`} data-testid={`team-score-${i + 1}`}>
                        <div className="flex items-center gap-2">
                          {isWinner && <Crown className="w-5 h-5 text-yellow-400" />}
                          <span className={`font-bold text-lg ${color.text}`}>Team {i + 1}</span>
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
                      </div>
                    );
                  })}
                </div>

                {/* Winner declaration */}
                {(() => {
                  const scores = store.isGameFinished ? store.teamTotalScores : store.teamRoundScores;
                  if (scores.length === 0) return null;
                  const maxCorrect = Math.max(...scores.map(s => s.correct));
                  if (maxCorrect === 0) return null;
                  const winners = scores.map((s, i) => ({ team: i + 1, correct: s.correct })).filter(t => t.correct === maxCorrect);
                  const isTie = winners.length > 1;
                  return (
                    <div className="mt-4 p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-yellow-400">
                          {store.isGameFinished ? 'Overall Winner: ' : 'Round Winner: '}
                          {isTie 
                            ? `Tie! ${winners.map(w => `Team ${w.team}`).join(' & ')}`
                            : `Team ${winners[0].team}`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })()}
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
          </>
        ) : (
          <>
            {/* Non-team Mode Layout - Left side: Score */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="space-y-2 animate-bounce-in">
                <div className="text-[8rem] font-thin text-yellow-400 leading-none" style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                   {store.currentScore}
                </div>
                <p className="text-lg font-medium text-foreground">Points this round</p>
              </div>

              {store.isGameFinished && (
                 <div className="bg-cyan-600 p-3 rounded-xl border-2 border-cyan-400 shadow-xl mt-4">
                   <div className="flex items-center justify-center space-x-2">
                      <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                      <h3 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        Total: <span className="text-yellow-300 font-thin text-3xl" style={{ fontFamily: 'var(--font-display)' }}>{store.totalScore}</span>
                      </h3>
                   </div>
                 </div>
              )}
            </div>

            {/* Right side - Word history, header, and button */}
            <div className="flex-1 flex flex-col gap-3 max-h-full">
              <div className="bg-card/80 rounded-xl border border-purple-500/30 p-3 shadow-xl flex-1 overflow-y-auto min-h-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]">
                <h3 className="text-sm font-bold mb-2 text-left sticky top-0 bg-card/80 z-10 pb-1 border-b border-border">Word History</h3>
                <div className="space-y-1">
                  {store.roundResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-background/50">
                      <span className="font-medium text-sm">{res.word}</span>
                      {res.correct ? (
                        <CheckCircle2 className="text-success w-5 h-5" />
                      ) : (
                        <ListX className="text-destructive w-5 h-5" />
                      )}
                    </div>
                  ))}
                  {store.roundResults.length === 0 && (
                     <p className="text-muted-foreground italic text-sm">No guesses made this round.</p>
                  )}
                </div>
              </div>

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
          </>
        )}
      </div>
    </div>
  );
}
