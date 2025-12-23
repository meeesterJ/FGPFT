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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {store.isGameFinished && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="max-w-md w-full space-y-8 z-10 text-center">
        
        <div className="space-y-4 animate-bounce-in">
          {store.isGameFinished ? (
            <h1 className="text-7xl font-thin tracking-wide transform -rotate-2 leading-none">
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>G</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>a</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>m</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>e</span>
              <span className="text-yellow-400 ml-4" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>O</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>v</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>e</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>r</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>!</span>
            </h1>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-5xl font-thin tracking-wide transform -rotate-2 leading-none mb-2">
                <span className="text-pink-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>R</span>
                <span className="text-cyan-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>o</span>
                <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>u</span>
                <span className="text-green-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>n</span>
                <span className="text-purple-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>d</span>
                <span className="text-yellow-400 ml-3 text-6xl" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>{store.currentRound}</span>
              </h1>
              <span className="text-xl text-muted-foreground uppercase tracking-widest">Complete</span>
            </div>
          )}
          <div className="text-[14rem] font-thin text-yellow-400 leading-none animate-bounce-in" style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
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
           <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-5 rounded-2xl border-2 border-purple-400 shadow-xl">
             <div className="flex items-center justify-center space-x-3">
                <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                <h3 className="text-3xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Total Score: <span className="text-yellow-300 font-thin text-4xl">{store.totalScore}</span>
                </h3>
             </div>
           </div>
        )}

        <div className="flex flex-col gap-4 pt-4">
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-cyan-400"
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

          <Button variant="outline" size="lg" onClick={handleHome} className="hover:scale-105 transition-transform">
            <Home className="mr-2 w-5 h-5" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
