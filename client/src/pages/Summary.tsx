import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowRight, Home, Trophy, ListX, CheckCircle2 } from "lucide-react";
import Confetti from "react-confetti";
import { useState, useEffect, useRef } from 'react';
import { playSound } from "@/lib/audio";

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

  // Play game end sound when game is finished
  useEffect(() => {
    if (store.isGameFinished && !hasPlayedGameEndSound.current) {
      hasPlayedGameEndSound.current = true;
      playSound('gameEnd');
    }
  }, [store.isGameFinished]);

  const isLastRound = store.currentRound >= store.totalRounds && !store.isGameFinished;

  const handleNext = () => {
    if (store.isGameFinished) {
      // Start a new game immediately with current settings
      store.startGame();
      setLocation("/game");
    } else if (isLastRound) {
      // This is the final round - calling startRound will set isGameFinished=true
      // Stay on this page to show the final scoreboard
      store.startRound();
      // Page will re-render with isGameFinished=true, showing confetti and total score
    } else {
      store.startRound();
      setLocation("/game");
    }
  };

  const handleHome = () => {
    store.resetGame();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {store.isGameFinished && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="max-w-md w-full space-y-8 z-10 text-center">
        
        <div className="space-y-2 animate-bounce-in">
          <h2 className="text-3xl font-bold text-muted-foreground uppercase tracking-widest">
            {store.isGameFinished ? "Game Over!" : `Round ${store.currentRound} Complete`}
          </h2>
          <div className="text-9xl font-black text-primary drop-shadow-2xl filter animate-bounce-in">
             {store.currentScore}
          </div>
          <p className="text-xl font-medium text-foreground">Points this round</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl max-h-[40vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 text-left sticky top-0 bg-card z-10 pb-2 border-b border-border">Word History</h3>
          <div className="space-y-3">
            {store.roundResults.map((res, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <span className="font-medium text-lg">{res.word}</span>
                {res.correct ? (
                  <CheckCircle2 className="text-success w-6 h-6" />
                ) : (
                  <ListX className="text-destructive w-6 h-6" />
                )}
              </div>
            ))}
            {store.roundResults.length === 0 && (
               <p className="text-muted-foreground italic">No guesses made this round.</p>
            )}
          </div>
        </div>

        {store.isGameFinished && (
           <div className="bg-secondary/20 p-4 rounded-xl border border-secondary">
             <div className="flex items-center justify-center space-x-3 mb-2">
                <Trophy className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-black text-secondary-foreground">TOTAL SCORE: {store.totalScore}</h3>
             </div>
           </div>
        )}

        <div className="flex flex-col gap-4 pt-4">
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-bold shadow-lg" 
            onClick={handleNext}
          >
            {store.isGameFinished ? (
              <>
                <RotateCcw className="mr-2 w-6 h-6" /> Play Again
              </>
            ) : isLastRound ? (
              <>
                And the Winner Is... <Trophy className="ml-2 w-6 h-6" />
              </>
            ) : (
              <>
                Next Round <ArrowRight className="ml-2 w-6 h-6" />
              </>
            )}
          </Button>

          <Button variant="outline" size="lg" onClick={handleHome}>
            <Home className="mr-2 w-5 h-5" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
