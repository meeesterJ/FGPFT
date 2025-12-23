import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, Home, Trophy, ListX, CheckCircle2 } from "lucide-react";
import Confetti from "react-confetti";
import { useState, useEffect, useRef } from 'react';
import { playSound, stopSound } from "@/lib/audio";

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
        playSound('gameEnd');
        playSound('applause');
      }
    }
  }, [store.isGameFinished, store.soundEnabled]);

  // Play drumroll when showing "And the Winner Is..." button
  useEffect(() => {
    if (isLastRound && !hasPlayedDrumroll.current) {
      hasPlayedDrumroll.current = true;
      if (store.soundEnabled) {
        playSound('drumroll');
      }
    }
  }, [isLastRound, store.soundEnabled]);

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
      
      <div className="w-full h-full max-h-full z-10 flex flex-row gap-4">
        
        {/* Left side - Score display */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="space-y-2 animate-bounce-in">
            {store.isGameFinished ? (
              <h1 className="text-4xl font-thin tracking-wide transform -rotate-2 leading-none">
                <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>Game Over!</span>
              </h1>
            ) : (
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-thin tracking-wide transform -rotate-2 leading-none">
                  <span className="text-pink-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>R</span>
                  <span className="text-cyan-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>o</span>
                  <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>u</span>
                  <span className="text-green-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>n</span>
                  <span className="text-purple-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>d</span>
                  <span className="text-yellow-400 ml-2 text-4xl" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>{store.currentRound}</span>
                </h1>
                <span className="text-sm text-muted-foreground uppercase tracking-widest">Complete</span>
              </div>
            )}
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

        {/* Right side - Word history and buttons */}
        <div className="flex-1 flex flex-col gap-3 max-h-full">
          <div className="bg-card rounded-xl border border-border p-3 shadow-xl flex-1 overflow-y-auto min-h-0">
            <h3 className="text-sm font-bold mb-2 text-left sticky top-0 bg-card z-10 pb-1 border-b border-border">Word History</h3>
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

          <div className="flex flex-col gap-2">
            <Button 
              size="lg" 
              className="w-full h-12 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-pink-500 hover:bg-pink-400 text-white border-2 border-pink-400"
              onClick={handleNext}
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

            <Button variant="outline" size="default" onClick={handleHome} className="hover:scale-105 transition-transform">
              <Home className="mr-2 w-4 h-4" /> Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
