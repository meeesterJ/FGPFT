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
  const [calibrationTrigger, setCalibrationTrigger] = useState(0); // Increment to force recalibration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tiltThresholdRef = useRef(25); // Degrees of tilt delta to trigger (lowered for better sensitivity)
  const lastTiltTimeRef = useRef(0);
  const orientationAngleRef = useRef(0); // Track screen orientation angle
  const hasStartedRound = useRef(false); // Prevent multiple startRound calls
  const wasInPortrait = useRef(true); // Track if we were in portrait (for countdown trigger)
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([]); // Track countdown timeouts
  const isCountdownActiveRef = useRef(false); // Guard against overlapping countdowns
  const hasShownInitialCountdownRef = useRef(false); // Track if initial countdown shown
  const permissionGrantedTimeRef = useRef(0); // Track when permission was granted for delay
  const baselineBetaRef = useRef<number | null>(null); // Baseline beta for calibrated tilt detection
  const calibrationSamplesRef = useRef<number[]>([]); // Samples for averaging baseline
  const isCalibrating = useRef(false); // Flag to indicate calibration in progress
  const nextWordRef = useRef(store.nextWord); // Stable ref for nextWord function
  const pendingGestureRef = useRef<boolean | null>(null); // Pending gesture result (true=correct, false=pass, null=none)
  const returnThresholdRef = useRef(10); // Degrees from baseline to consider "returned to center"
  const mustReturnToCenterRef = useRef(false); // After button click, must return to center before new tilt gesture
  const lastOrientationTypeRef = useRef<string | null>(null); // Track orientation type used during calibration
  const wordDisplayRef = useRef<HTMLHeadingElement>(null); // Ref for auto-scaling word display
  const wordContainerRef = useRef<HTMLDivElement>(null); // Ref for word container
  const [wordFontSize, setWordFontSize] = useState<string | null>(null); // Custom font size for long words
  
  // Debug state for tilt troubleshooting
  const [debugInfo, setDebugInfo] = useState<{
    orientationType: string;
    gamma: number;
    beta: number;
    effectiveTilt: number;
    baseline: number | null;
    tiltDelta: number;
  } | null>(null);
  
  // Keep nextWord ref updated
  useEffect(() => {
    nextWordRef.current = store.nextWord;
  }, [store.nextWord]);

  // When hasDeviceOrientation becomes true (permission granted), start countdown if in landscape
  useEffect(() => {
    if (hasDeviceOrientation && waitingForPermission) {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        setWaitingForPermission(false);
        startCountdown();
      }
    }
  }, [hasDeviceOrientation, waitingForPermission]);

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

    // Try to lock to current landscape orientation to prevent flipping
    const lockToCurrentLandscape = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          // Get current orientation type to lock to it specifically
          const currentType = screen.orientation.type;
          if (currentType === 'landscape-primary' || currentType === 'landscape-secondary') {
            // Lock to current landscape orientation to prevent flip
            await (screen.orientation as any).lock(currentType);
            setShowRotatePrompt(false);
          } else {
            // Not in landscape yet, lock to any landscape
            await (screen.orientation as any).lock('landscape');
          }
        }
      } catch (e) {
        // Screen orientation lock not supported or failed - show prompt instead
      }
    };

    // Check if device is in landscape and prompt to rotate if not
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      
      // If in landscape and we haven't shown the initial countdown yet
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        wasInPortrait.current = false;
        
        // Lock to current landscape orientation when we enter landscape
        lockToCurrentLandscape();
        
        // Check if iOS needs permission - test by checking if we already have orientation events
        if (typeof DeviceOrientationEvent !== "undefined" && 
            typeof (DeviceOrientationEvent as any).requestPermission === "function") {
          // iOS 13+ - check if permission was already granted by testing for events
          // If hasDeviceOrientation is already true, permission was granted on home screen
          if (hasDeviceOrientation) {
            // Permission already granted - start countdown immediately
            startCountdown();
          } else {
            // Need to wait for permission
            setWaitingForPermission(true);
          }
        } else {
          // Non-iOS or older iOS - start countdown immediately
          startCountdown();
        }
      } else if (!isLandscape) {
        // Entering portrait
        if (!wasInPortrait.current) {
          // Was in landscape, now in portrait - mark baseline invalid
          wasInPortrait.current = true;
          baselineBetaRef.current = null;
          isCalibrating.current = false;
          calibrationSamplesRef.current = [];
        }
      }
      
      // When returning to landscape from portrait (after initial countdown has played),
      // bump trigger to force recalibration and re-lock orientation
      if (isLandscape && wasInPortrait.current && hasShownInitialCountdownRef.current) {
        wasInPortrait.current = false;
        setCalibrationTrigger(prev => prev + 1);
        lockToCurrentLandscape();
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
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      checkOrientation();
    };
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    if (screen.orientation) {
      screen.orientation.addEventListener("change", handleOrientationChange);
    }

    // Check if device orientation is available
    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        // iOS 13+ - test if permission was already granted by listening for an event
        let testTimeout: NodeJS.Timeout;
        const testHandler = (e: DeviceOrientationEvent) => {
          // We received an orientation event - permission was granted!
          clearTimeout(testTimeout);
          window.removeEventListener("deviceorientation", testHandler);
          setHasDeviceOrientation(true);
          setNeedsIOSPermission(false);
          // Don't clear waitingForPermission here - the useEffect watching hasDeviceOrientation will handle it
        };
        window.addEventListener("deviceorientation", testHandler);
        // If no event received within 500ms, permission not granted
        testTimeout = setTimeout(() => {
          window.removeEventListener("deviceorientation", testHandler);
          setNeedsIOSPermission(true);
          setHasDeviceOrientation(false);
        }, 500);
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

  // Track which calibrationTrigger value we've already calibrated for
  const lastCalibratedTriggerRef = useRef<number>(-1);
  
  // Device orientation listener
  useEffect(() => {
    // Disable tilt during countdown or when in portrait
    const isLandscape = window.innerWidth > window.innerHeight;
    if (!hasDeviceOrientation || !store.isPlaying || isPaused || isCountingDown || !isLandscape) return;
    
    // Only start fresh calibration when calibrationTrigger changes (not on every effect run)
    const needsCalibration = lastCalibratedTriggerRef.current !== calibrationTrigger;
    
    // Track the cooldown defer timeout
    let cooldownDeferTimeout: NodeJS.Timeout | null = null;
    
    if (needsCalibration) {
      const now = Date.now();
      const timeSinceLastTilt = now - lastTiltTimeRef.current;
      const cooldownRemaining = 2000 - timeSinceLastTilt;
      
      if (cooldownRemaining > 0) {
        // Still in cooldown - defer calibration until cooldown expires
        cooldownDeferTimeout = setTimeout(() => {
          // Only calibrate if still in landscape when timeout fires
          const stillLandscape = window.innerWidth > window.innerHeight;
          if (!stillLandscape) return; // Skip - next landscape entry will trigger recalibration
          
          lastCalibratedTriggerRef.current = calibrationTrigger;
          baselineBetaRef.current = null;
          isCalibrating.current = true;
          calibrationSamplesRef.current = [];
          pendingGestureRef.current = null; // Clear any pending gesture on recalibration
          mustReturnToCenterRef.current = false; // Clear return-to-center guard
          setTiltFeedback(null);
        }, cooldownRemaining);
      } else {
        // No cooldown - calibrate immediately
        lastCalibratedTriggerRef.current = calibrationTrigger;
        baselineBetaRef.current = null;
        isCalibrating.current = true;
        calibrationSamplesRef.current = [];
        pendingGestureRef.current = null; // Clear any pending gesture on recalibration
        mustReturnToCenterRef.current = false; // Clear return-to-center guard
        setTiltFeedback(null);
      }
    }
    
    // Grace period timer - finalize calibration 500ms after first sample
    let graceTimeout: NodeJS.Timeout | null = null;
    
    const finalizeCalibration = () => {
      if (calibrationSamplesRef.current.length > 0) {
        const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
        baselineBetaRef.current = sum / calibrationSamplesRef.current.length;
        isCalibrating.current = false;
        calibrationSamplesRef.current = [];
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const eventTime = Date.now();
      
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;
      
      // Determine current orientation type on EVERY event (not from cached ref)
      // This ensures calibration and gesture detection use the same axis
      let orientationType: string = 'portrait-primary';
      if (screen.orientation && screen.orientation.type) {
        orientationType = screen.orientation.type;
      } else if (typeof (window as any).orientation === 'number') {
        // Fallback for older browsers
        const winOrient = (window as any).orientation;
        if (winOrient === 90) orientationType = 'landscape-primary';
        else if (winOrient === -90 || winOrient === 270) orientationType = 'landscape-secondary';
        else orientationType = 'portrait-primary';
      }
      
      // Check if orientation changed since last calibration - if so, trigger recalibration
      if (lastOrientationTypeRef.current !== null && 
          lastOrientationTypeRef.current !== orientationType) {
        // Orientation changed - immediately invalidate baseline to prevent stale data use
        baselineBetaRef.current = null;
        isCalibrating.current = true;
        calibrationSamplesRef.current = [];
        pendingGestureRef.current = null;
        mustReturnToCenterRef.current = false;
        setTiltFeedback(null);
        // Trigger recalibration via state update for proper grace period handling
        lastOrientationTypeRef.current = orientationType;
        setCalibrationTrigger(prev => prev + 1);
        return; // Skip this event, wait for proper recalibration
      }
      lastOrientationTypeRef.current = orientationType;
      
      // Use gamma for landscape mode (it measures the forward/backward tilt)
      // gamma ranges from -90 to 90 degrees
      // On iOS Safari:
      // - landscape-primary (home button on right): gamma INCREASES when tilting forward
      // - landscape-secondary (home button on left): gamma DECREASES when tilting forward
      let effectiveTilt = 0;
      if (orientationType === 'landscape-primary' || orientationType === 'landscape-secondary') {
        // Landscape mode: use gamma for forward/backward tilt
        if (orientationType === 'landscape-primary') {
          // Home button on right: gamma increases with forward tilt
          effectiveTilt = gamma;
        } else {
          // Home button on left: gamma decreases with forward tilt, so invert
          effectiveTilt = -gamma;
        }
      } else {
        // Portrait: use beta
        effectiveTilt = beta;
      }
      
      // Calibration phase: collect samples to establish baseline
      if (isCalibrating.current) {
        calibrationSamplesRef.current.push(effectiveTilt);
        
        // Start grace period after first sample - wait 500ms then finalize
        if (calibrationSamplesRef.current.length === 1 && !graceTimeout) {
          graceTimeout = setTimeout(finalizeCalibration, 500);
        }
        
        // Also finalize if we hit 10 samples before grace period ends
        if (calibrationSamplesRef.current.length >= 10) {
          if (graceTimeout) clearTimeout(graceTimeout);
          finalizeCalibration();
        }
        return;
      }
      
      // Wait for calibration to complete
      if (baselineBetaRef.current === null) return;
      
      // Calculate tilt delta from calibrated baseline
      const tiltDelta = effectiveTilt - baselineBetaRef.current;
      const absDelta = Math.abs(tiltDelta);
      const isAtCenter = absDelta <= returnThresholdRef.current;
      
      // Update debug info for on-screen display
      setDebugInfo({
        orientationType,
        gamma,
        beta,
        effectiveTilt,
        baseline: baselineBetaRef.current,
        tiltDelta
      });

      // If we must return to center first (after button click), wait for that
      if (mustReturnToCenterRef.current) {
        if (isAtCenter) {
          // User returned to center - can now accept new tilt gestures
          mustReturnToCenterRef.current = false;
        }
        return; // Don't process any gestures until centered
      }

      // If we have a pending gesture, check if user returned to center
      if (pendingGestureRef.current !== null) {
        if (isAtCenter) {
          // User returned to center - advance word now
          const wasCorrect = pendingGestureRef.current;
          pendingGestureRef.current = null;
          lastTiltTimeRef.current = Date.now(); // Update for cooldown logic
          setTiltFeedback(null);
          nextWordRef.current(wasCorrect);
        }
        return; // Don't process new gestures until return to center
      }

      // No pending gesture - check for new tilt gesture
      if (tiltDelta > tiltThresholdRef.current) {
        // Tilted forward (screen toward user) = CORRECT
        pendingGestureRef.current = true;
        setTiltFeedback("correct");
      } else if (tiltDelta < -tiltThresholdRef.current) {
        // Tilted backward (screen away from user) = PASS
        pendingGestureRef.current = false;
        setTiltFeedback("pass");
      }
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation);
    return () => {
      if (cooldownDeferTimeout) clearTimeout(cooldownDeferTimeout);
      if (graceTimeout) clearTimeout(graceTimeout);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [hasDeviceOrientation, store.isPlaying, isPaused, isCountingDown, calibrationTrigger]);

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

  // Auto-scale font size for long words that don't fit on one line
  useEffect(() => {
    if (!wordDisplayRef.current || !wordContainerRef.current || !store.currentWord) {
      setWordFontSize(null);
      return;
    }

    // Reset font size first to get natural size
    setWordFontSize(null);
    
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const container = wordContainerRef.current;
      const display = wordDisplayRef.current;
      if (!container || !display) return;
      
      const containerWidth = container.clientWidth * 0.9; // 90% of container width
      const words = store.currentWord?.split(' ') || [];
      
      // Find the longest single word
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Get computed style for font
      const computedStyle = window.getComputedStyle(display);
      const baseFontSize = parseFloat(computedStyle.fontSize);
      ctx.font = `${computedStyle.fontWeight} ${baseFontSize}px ${computedStyle.fontFamily}`;
      
      // Measure each word
      let longestWordWidth = 0;
      for (const word of words) {
        const width = ctx.measureText(word).width;
        if (width > longestWordWidth) {
          longestWordWidth = width;
        }
      }
      
      // If longest word is wider than container, scale down
      if (longestWordWidth > containerWidth) {
        const scaleFactor = containerWidth / longestWordWidth;
        const newFontSize = Math.floor(baseFontSize * scaleFactor * 0.95); // 95% to add margin
        setWordFontSize(`${Math.max(newFontSize, 16)}px`); // Minimum 16px
      } else {
        setWordFontSize(null);
      }
    });
  }, [store.currentWord]);

  const handleCorrect = () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    pendingGestureRef.current = null; // Clear any pending tilt gesture
    mustReturnToCenterRef.current = true; // Require return to center before next tilt gesture
    setTiltFeedback("correct");
    store.nextWord(true);
    setTimeout(() => {
      setTiltFeedback(null);
      setIsProcessing(false);
    }, 300);
  };

  const handlePass = () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    pendingGestureRef.current = null; // Clear any pending tilt gesture
    mustReturnToCenterRef.current = true; // Require return to center before next tilt gesture
    setTiltFeedback("pass");
    store.nextWord(false);
    setTimeout(() => {
      setTiltFeedback(null);
      setIsProcessing(false);
    }, 300);
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
    
    // Reset calibration for new round
    baselineBetaRef.current = null;
    calibrationSamplesRef.current = [];
    isCalibrating.current = false;
    
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
      // Reset tilt time to allow immediate calibration (no cooldown blocking)
      lastTiltTimeRef.current = 0;
      // Trigger recalibration by bumping the trigger state
      setCalibrationTrigger(prev => prev + 1);
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

      {/* Debug Info Display - for troubleshooting tilt */}
      {debugInfo && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white px-3 py-2 rounded text-xs font-mono z-50 max-w-xs">
          <div>orient: {debugInfo.orientationType}</div>
          <div>gamma: {debugInfo.gamma.toFixed(1)}</div>
          <div>beta: {debugInfo.beta.toFixed(1)}</div>
          <div>effTilt: {debugInfo.effectiveTilt.toFixed(1)}</div>
          <div>baseline: {debugInfo.baseline?.toFixed(1) ?? 'null'}</div>
          <div className={debugInfo.tiltDelta > 25 ? 'text-green-400' : debugInfo.tiltDelta < -25 ? 'text-red-400' : ''}>
            delta: {debugInfo.tiltDelta.toFixed(1)}
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10">
        <div 
          ref={wordContainerRef}
          className="bg-card rounded-3xl border-4 border-border flex items-center justify-center p-6 md:p-8 shadow-2xl relative overflow-hidden group w-full h-full max-w-2xl max-h-96"
        >
           {/* Card Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
           
           <h1 
             ref={wordDisplayRef}
             className="word-display font-body text-center text-white animate-bounce-in"
             style={wordFontSize ? { fontSize: wordFontSize } : undefined}
           >
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
