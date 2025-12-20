import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, X, Pause, Play, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Game() {
  const [, setLocation] = useLocation();
  const store = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(store.roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [tiltFeedback, setTiltFeedback] = useState<"correct" | "pass" | null>(null);
  const [hasDeviceOrientation, setHasDeviceOrientation] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerHeight < window.innerWidth);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tiltThresholdRef = useRef(35); // Degrees of tilt to trigger
  const lastTiltTimeRef = useRef(0);

  // Initialize round and device orientation
  useEffect(() => {
    // Only start round if we aren't already playing and haven't just finished
    if (!store.isPlaying && !store.isRoundOver && !store.isGameFinished) {
      store.startRound();
    }
    
    // Reset timer
    setTimeLeft(store.roundDuration);

    // Handle orientation changes
    const handleOrientationChange = () => {
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    // Request permission for device orientation (iOS 13+)
    if (typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission()
        .then((perm: string) => {
          if (perm === "granted") {
            setHasDeviceOrientation(true);
          }
        })
        .catch(() => {
          // Permission denied or not available
        });
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      // Non-iOS or older iOS
      setHasDeviceOrientation(true);
    }

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []); // Only on mount

  // Device orientation listener
  useEffect(() => {
    if (!hasDeviceOrientation || !store.isPlaying || isPaused) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      // Debounce: only allow one gesture per 1 second
      if (now - lastTiltTimeRef.current < 1000) return;

      let tiltValue = 0;
      // In portrait: use beta (forward/backward), in landscape: use gamma (left/right)
      if (isLandscape) {
        tiltValue = event.gamma || 0; // Left/right tilt
      } else {
        tiltValue = event.beta || 0; // Forward/backward tilt
      }

      if (tiltValue > tiltThresholdRef.current) {
        // Tilted forward/right significantly = CORRECT
        lastTiltTimeRef.current = now;
        setTiltFeedback("correct");
        setTimeout(() => setTiltFeedback(null), 300);
        store.nextWord(true);
      } else if (tiltValue < -tiltThresholdRef.current) {
        // Tilted backward/left significantly = PASS
        lastTiltTimeRef.current = now;
        setTiltFeedback("pass");
        setTimeout(() => setTiltFeedback(null), 300);
        store.nextWord(false);
      }
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [store.isPlaying, isPaused, store, isLandscape]);

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
    <div className={cn("h-screen w-full flex bg-background overflow-hidden relative", isLandscape ? "flex-row" : "flex-col")}>
      {/* Top/Left Bar */}
      <div className={cn("flex justify-between items-center z-20", isLandscape ? "flex-col w-auto h-full px-4 py-6 gap-4 border-r border-border" : "flex-row p-4 w-full h-auto gap-2")}>
        <Button variant="ghost" size="icon" onClick={togglePause} className="rounded-full bg-card/50 backdrop-blur">
          {isPaused ? <Play className={cn("w-6 h-6", isLandscape && "w-5 h-5")} /> : <Pause className={cn("w-6 h-6", isLandscape && "w-5 h-5")} />}
        </Button>
        
        <div className={cn(
          "font-black font-mono tracking-tighter",
          timeLeft <= 10 ? "text-destructive animate-pulse" : "text-primary",
          isLandscape ? "text-3xl" : "text-4xl"
        )}>
          {timeLeft}s
        </div>

        <div className={cn("font-bold bg-card/50 px-4 py-2 rounded-full backdrop-blur", isLandscape ? "text-sm" : "text-xl")}>
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

      {/* Tilt Feedback Animation */}
      {tiltFeedback && (
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 text-6xl font-black animate-bounce-in",
          tiltFeedback === "correct" ? "text-success" : "text-destructive"
        )}>
          {tiltFeedback === "correct" ? <Check className="w-32 h-32" /> : <X className="w-32 h-32" />}
        </div>
      )}

      {/* Gesture Hint - shown if device orientation not available */}
      {!hasDeviceOrientation && (
        <div className="absolute top-4 right-4 bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-20">
          <Smartphone className="w-4 h-4" />
          Tilt gestures not available on this device
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10">
        <div className={cn("bg-card rounded-3xl border-4 border-border flex items-center justify-center p-6 md:p-8 shadow-2xl relative overflow-hidden group", 
          isLandscape ? "w-full h-full max-w-2xl max-h-96" : "w-full max-w-lg aspect-[4/3]"
        )}>
           {/* Card Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
           
           <h1 className="word-display font-bold font-body text-center text-white animate-bounce-in">
             {store.currentWord}
           </h1>
        </div>
      </div>

      {/* Controls */}
      <div className={cn("flex z-20", isLandscape ? "flex-col w-auto h-full" : "flex-row h-1/3")}>
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
