import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, X, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";

export default function Game() {
  const [, setLocation] = useLocation();
  const store = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(store.roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize round
  useEffect(() => {
    // Only start round if we aren't already playing and haven't just finished
    if (!store.isPlaying && !store.isRoundOver && !store.isGameFinished) {
      store.startRound();
    }
    
    // Reset timer
    setTimeLeft(store.roundDuration);
  }, []); // Only on mount

  // Timer logic
  useEffect(() => {
    if (store.isPlaying && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            store.endRound();
            setLocation("/summary");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.isPlaying, isPaused, timeLeft]);

  // Handle Game Over / Round End Redirect
  useEffect(() => {
    if (store.isRoundOver || store.isGameFinished) {
      setLocation("/summary");
    }
  }, [store.isRoundOver, store.isGameFinished]);

  const handleCorrect = () => {
    store.nextWord(true);
  };

  const handlePass = () => {
    store.nextWord(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!store.currentWord) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center z-20">
        <Button variant="ghost" size="icon" onClick={togglePause} className="rounded-full bg-card/50 backdrop-blur">
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </Button>
        
        <div className={cn(
          "text-4xl font-black font-mono tracking-tighter",
          timeLeft <= 10 ? "text-destructive animate-pulse" : "text-primary"
        )}>
          {timeLeft}s
        </div>

        <div className="text-xl font-bold bg-card/50 px-4 py-2 rounded-full backdrop-blur">
          Score: <span className="text-accent">{store.currentScore}</span>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
          <h2 className="text-5xl font-black text-primary">PAUSED</h2>
          <Button size="lg" className="text-xl px-8 py-6 rounded-xl" onClick={togglePause}>
            Resume Game
          </Button>
          <Button variant="destructive" className="text-lg" onClick={() => {
              store.endRound();
              setLocation("/summary");
          }}>
            End Round Early
          </Button>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div className="w-full max-w-lg aspect-[4/3] bg-card rounded-3xl border-4 border-border flex items-center justify-center p-8 shadow-2xl relative overflow-hidden group">
           {/* Card Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
           
           <h1 className="text-5xl md:text-7xl text-center font-black leading-tight text-foreground break-words animate-bounce-in">
             {store.currentWord}
           </h1>
        </div>
      </div>

      {/* Controls */}
      <div className="h-1/3 flex z-20">
        <button 
          onClick={handlePass}
          className="flex-1 bg-destructive hover:bg-destructive/90 active:bg-destructive/80 transition-colors flex items-center justify-center group"
        >
          <div className="flex flex-col items-center">
            <X className="w-16 h-16 text-white mb-2 group-active:scale-90 transition-transform" />
            <span className="text-white font-bold text-xl uppercase tracking-widest">Pass</span>
          </div>
        </button>
        <button 
          onClick={handleCorrect}
          className="flex-1 bg-success hover:bg-success/90 active:bg-success/80 transition-colors flex items-center justify-center group"
        >
          <div className="flex flex-col items-center">
            <Check className="w-16 h-16 text-black mb-2 group-active:scale-90 transition-transform" />
            <span className="text-black font-bold text-xl uppercase tracking-widest">Correct</span>
          </div>
        </button>
      </div>
    </div>
  );
}
