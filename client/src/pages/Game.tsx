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
  const [isProcessing, setIsProcessing] = useState(false); // Debounce button clicks
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [countdown, setCountdown] = useState<number | "Go!" | null>(null); // Countdown state
  const [isCountingDown, setIsCountingDown] = useState(true); // Start counting down immediately
  const [waitingForPermission, setWaitingForPermission] = useState(false); // Wait for iOS permission before countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tiltThresholdRef = useRef(35); // Degrees of tilt to trigger
  const lastTiltTimeRef = useRef(0);
  const orientationAngleRef = useRef(0); // Track screen orientation angle
  const hasStartedRound = useRef(false); // Prevent multiple startRound calls
  const wasInPortrait = useRef(true); // Track if we were in portrait (for countdown trigger)
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([]); // Track countdown timeouts
  const isCountdownActiveRef = useRef(false); // Guard against overlapping countdowns
  const hasShownInitialCountdownRef = useRef(false); // Track if initial countdown shown
  const permissionGrantedTimeRef = useRef(0); // Track when permission was granted for delay

  // Initialize round and device orientation
  useEffect(() => {
    // Only start round once per mount, using ref to prevent React StrictMode double-call
    if (!hasStartedRound.current && !store.isPlaying && !store.isRoundOver && !store.isGameFinished) {
      hasStartedRound.current = true;
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        store.startRound();
      }, 0);
    }
    
    // Reset timer
    setTimeLeft(store.roundDuration);

    // Check if device is in landscape and prompt to rotate if not
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      
      // If in landscape and we haven't shown the initial countdown yet
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        wasInPortrait.current = false;
        // Check if iOS needs permission - if so, wait for it before countdown
        if (typeof DeviceOrientationEvent !== "undefined" && 
            typeof (DeviceOrientationEvent as any).requestPermission === "function") {
          // iOS 13+ - wait for permission before starting countdown
          setWaitingForPermission(true);
        } else {
          // Non-iOS or older iOS - start countdown immediately
          startCountdown();
        }
      } else if (!isLandscape) {
        wasInPortrait.current = true;
      }
      
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

    // Check if device orientation is available (non-iOS or pre-iOS 13)
    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        // iOS 13+ requires user interaction to request permission
        setNeedsIOSPermission(true);
        setHasDeviceOrientation(false);
      } else {
        // Non-iOS or older iOS - orientation events are available
        setHasDeviceOrientation(true);
      }
    }

    return () => {
      // Clean up listeners and unlock orientation
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener("change", handleOrientationChange);
      }
      // Clear any countdown timeouts
      countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
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
    // Disable tilt during countdown
    if (!hasDeviceOrientation || !store.isPlaying || isPaused || isCountingDown) return;

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
        // Tilted forward (screen toward user) = CORRECT
        lastTiltTimeRef.current = now;
        setTiltFeedback("correct");
        setTimeout(() => setTiltFeedback(null), 300);
        store.nextWord(true);
      } else if (tiltValue < -tiltThresholdRef.current) {
        // Tilted backward (screen away from user) = PASS
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
  }, [hasDeviceOrientation, store.isPlaying, isPaused, isCountingDown, store]);

  // Timer logic - pause during countdown
  useEffect(() => {
    if (store.isPlaying && !isPaused && !isCountingDown && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.isPlaying, isPaused, isCountingDown, timeLeft]);

  // Handle timer expiration
  useEffect(() => {
    if (timeLeft <= 0 && store.isPlaying) {
      store.endRound();
    }
  }, [timeLeft, store.isPlaying]);

  // Handle Game Over / Round End Redirect
  useEffect(() => {
    if (store.isRoundOver || store.isGameFinished) {
      setLocation("/summary");
    }
  }, [store.isRoundOver, store.isGameFinished, setLocation]);

  const handleCorrect = () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    store.nextWord(true);
    setTimeout(() => setIsProcessing(false), 500);
  };

  const handlePass = () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    store.nextWord(false);
    setTimeout(() => setIsProcessing(false), 500);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const requestTiltPermission = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === "granted") {
          // Record when permission was granted - use for delay before enabling tilt
          permissionGrantedTimeRef.current = Date.now();
          // Also set lastTiltTime to prevent immediate tilt detection
          lastTiltTimeRef.current = Date.now() + 5000; // 5 second grace period after countdown
          
          setHasDeviceOrientation(true);
          setNeedsIOSPermission(false);
          setWaitingForPermission(false);
          
          // Now start the countdown
          if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
            startCountdown();
          }
        } else {
          // Permission denied - still start countdown, just without tilt
          setWaitingForPermission(false);
          setNeedsIOSPermission(false);
          if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
            startCountdown();
          }
        }
      } catch (e) {
        // Permission denied - still start countdown
        setWaitingForPermission(false);
        if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
          startCountdown();
        }
      }
    }
  };
  
  // Function to start the countdown (extracted to be callable from permission handler)
  const startCountdown = () => {
    // Guard: don't overlap countdowns (use ref to avoid stale closures)
    if (isCountdownActiveRef.current) return;
    isCountdownActiveRef.current = true;
    
    // Clear any existing timeouts
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    countdownTimeoutsRef.current = [];
    
    setIsCountingDown(true);
    setCountdown(3);
    
    countdownTimeoutsRef.current.push(setTimeout(() => setCountdown(2), 1000));
    countdownTimeoutsRef.current.push(setTimeout(() => setCountdown(1), 2000));
    countdownTimeoutsRef.current.push(setTimeout(() => setCountdown("Go!"), 3000));
    countdownTimeoutsRef.current.push(setTimeout(() => {
      setCountdown(null);
      setIsCountingDown(false);
      isCountdownActiveRef.current = false;
      hasShownInitialCountdownRef.current = true;
      // Reset tilt time to allow detection after countdown
      lastTiltTimeRef.current = Date.now();
    }, 4000));
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

      {/* iOS Permission Overlay - shown before countdown */}
      {waitingForPermission && !showRotatePrompt && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center space-y-8 p-8">
          <Smartphone className="w-24 h-24 text-primary" />
          <h2 className="text-3xl font-black text-primary text-center">Enable Tilt Gestures</h2>
          <p className="text-muted-foreground text-center text-lg max-w-md">
            Tap the button below to enable tilt gestures for a hands-free experience
          </p>
          <Button 
            onClick={requestTiltPermission}
            size="lg"
            className="text-xl px-8 py-6 rounded-xl bg-accent text-accent-foreground"
          >
            <Smartphone className="w-6 h-6 mr-3" />
            Enable Tilt Gestures
          </Button>
          <Button 
            variant="ghost"
            onClick={() => {
              setWaitingForPermission(false);
              setNeedsIOSPermission(false);
              startCountdown();
            }}
            className="text-muted-foreground"
          >
            Skip (use buttons instead)
          </Button>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-center animate-bounce-in" key={countdown}>
            <h1 className="text-[12rem] font-black text-primary leading-none drop-shadow-2xl">
              {countdown}
            </h1>
          </div>
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

      
      {/* Gesture Hint - shown if device orientation not available and not iOS */}
      {!hasDeviceOrientation && !needsIOSPermission && !waitingForPermission && (
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
          disabled={isProcessing || !store.isPlaying || isCountingDown}
          className={cn(
            "flex-1 bg-destructive hover:bg-destructive/90 active:bg-destructive/80 transition-colors flex items-center justify-center group",
            (isProcessing || !store.isPlaying || isCountingDown) && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-center">
            <X className="w-16 h-16 text-white mb-2 group-active:scale-90 transition-transform" />
            <span className="text-white font-bold text-xl uppercase tracking-widest">Pass</span>
          </div>
        </button>
        <button 
          onClick={handleCorrect}
          disabled={isProcessing || !store.isPlaying || isCountingDown}
          className={cn(
            "flex-1 bg-success hover:bg-success/90 active:bg-success/80 transition-colors flex items-center justify-center group",
            (isProcessing || !store.isPlaying || isCountingDown) && "opacity-50 cursor-not-allowed"
          )}
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
