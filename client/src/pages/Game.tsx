import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, X, Pause, Play, Smartphone, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Game() {
  const [, setLocation] = useLocation();
  const store = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(store.roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [tiltFeedback, setTiltFeedback] = useState<"correct" | "pass" | null>(null);
  const [hasDeviceOrientation, setHasDeviceOrientation] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tiltThresholdRef = useRef(35); // Degrees of tilt to trigger
  const lastTiltTimeRef = useRef(0);
  const orientationAngleRef = useRef(0); // Track screen orientation angle

  // Initialize round and device orientation
  useEffect(() => {
    // Only start round if we aren't already playing and haven't just finished
    if (!store.isPlaying && !store.isRoundOver && !store.isGameFinished) {
      store.startRound();
    }
    
    // Reset timer
    setTimeLeft(store.roundDuration);

    // Check if device is in landscape and prompt to rotate if not
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setShowRotatePrompt(!isLandscape);
      
      // Track orientation angle for tilt calculations
      if (screen.orientation) {
        orientationAngleRef.current = screen.orientation.angle;
      } else if (typeof (window as any).orientation === 'number') {
        orientationAngleRef.current = (window as any).orientation;
      }
    };
    
    checkOrientation();
    
    // Try to lock to landscape (works on Android, not iOS)
    const lockToLandscape = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
          setShowRotatePrompt(false);
        }
      } catch (e) {
        // Screen orientation lock not supported or failed - show prompt instead
      }
    };
    lockToLandscape();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      checkOrientation();
    };
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", handleOrientationChange);
    }

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
      // Clean up listeners and unlock orientation
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", handleOrientationChange);
      }
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {
        // Ignore unlock errors
      }
    };
  }, []); // Only on mount

  // Device orientation listener
  useEffect(() => {
    if (!hasDeviceOrientation || !store.isPlaying || isPaused) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now();
      // Debounce: only allow one gesture per 1 second
      if (now - lastTiltTimeRef.current < 1000) return;

      // Get the current orientation angle
      const angle = orientationAngleRef.current;
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;
      
      // Calculate effective tilt based on device orientation
      // In landscape mode, gamma represents front/back tilt, but sign varies by orientation
      // Landscape left (90): forward tilt = negative gamma, so we negate to make positive = forward
      // Landscape right (-90/270): forward tilt = positive gamma, so we use as-is
      let tiltValue = 0;
      
      if (angle === 90) {
        // Landscape left: negate gamma so forward tilt becomes positive
        tiltValue = -gamma;
      } else if (angle === -90 || angle === 270) {
        // Landscape right: gamma already positive for forward tilt
        tiltValue = gamma;
      } else {
        // Portrait or unknown: use beta (positive = forward tilt)
        tiltValue = beta;
      }

      if (tiltValue > tiltThresholdRef.current) {
        // Tilted forward = CORRECT
        lastTiltTimeRef.current = now;
        setTiltFeedback("correct");
        setTimeout(() => setTiltFeedback(null), 300);
        store.nextWord(true);
      } else if (tiltValue < -tiltThresholdRef.current) {
        // Tilted backward = PASS
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
  }, [store.isPlaying, isPaused, store]);

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
  }, [store.isRoundOver, store.isGameFinished, setLocation]);

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
    <div className={cn("h-screen w-full flex bg-background overflow-hidden relative", "flex-row")}>
      {/* Rotate Prompt Overlay */}
      {showRotatePrompt && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 p-8">
          <RotateCcw className="w-24 h-24 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-3xl font-black text-primary text-center">Please Rotate Your Device</h2>
          <p className="text-muted-foreground text-center text-lg">Turn your phone sideways to play in landscape mode</p>
        </div>
      )}

      {/* Top/Left Bar */}
      <div className="flex flex-col w-auto h-full px-4 py-6 gap-4 border-r border-border justify-between items-center z-20">
        <Button variant="ghost" size="icon" onClick={togglePause} className="rounded-full bg-card/50 backdrop-blur">
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
        
        <div className={cn(
          "font-black font-mono tracking-tighter text-3xl",
          timeLeft <= 10 ? "text-destructive animate-pulse" : "text-primary"
        )}>
          {timeLeft}s
        </div>

        <div className="font-bold bg-card/50 px-4 py-2 rounded-full backdrop-blur text-sm">
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
        <div className="bg-card rounded-3xl border-4 border-border flex items-center justify-center p-6 md:p-8 shadow-2xl relative overflow-hidden group w-full h-full max-w-2xl max-h-96">
           {/* Card Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
           
           <h1 className="word-display font-body text-center text-white animate-bounce-in">
             {store.currentWord}
           </h1>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col w-auto h-full z-20">
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
