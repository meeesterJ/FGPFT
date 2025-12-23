import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Check, X, Home, Play, Smartphone, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAudioContext, initAudioContext, playSound } from "@/lib/audio";

export default function Game() {
  const [, setLocation] = useLocation();
  const store = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(store.roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [tiltFeedback, setTiltFeedback] = useState<"correct" | "pass" | null>(null);
  const [hasDeviceOrientation, setHasDeviceOrientation] = useState(store.tiltPermissionGranted);
  const [isHydrated, setIsHydrated] = useState(useGameStore.persist.hasHydrated());
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Debounce button clicks
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [countdown, setCountdown] = useState<number | "Go!" | null>(null); // Countdown state
  const [isCountingDown, setIsCountingDown] = useState(false); // Start as false, only count after onReady
  const [waitingForPermission, setWaitingForPermission] = useState(false); // Wait for iOS permission before countdown
  const [isWaitingForReady, setIsWaitingForReady] = useState(false); // Wait for user to be ready before countdown
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
  const rawGammaBaselineRef = useRef<number | null>(null); // Raw gamma baseline for wrap detection
  const calibrationSamplesRef = useRef<number[]>([]); // Samples for averaging baseline
  const rawGammaSamplesRef = useRef<number[]>([]); // Raw gamma samples for wrap detection baseline
  const isCalibrating = useRef(false); // Flag to indicate calibration in progress
  const nextWordRef = useRef(store.nextWord); // Stable ref for nextWord function
  const pendingGestureRef = useRef<boolean | null>(null); // Pending gesture result (true=correct, false=pass, null=none)
  const returnThresholdRef = useRef(10); // Degrees from baseline to consider "returned to center"
  const mustReturnToCenterRef = useRef(false); // After button click, must return to center before new tilt gesture
  const lastOrientationTypeRef = useRef<string | null>(null); // Track orientation type used during calibration
  const permissionProbeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track permission probe timeout for cancellation
  const permissionProbeHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null); // Track permission probe handler
  const wordDisplayRef = useRef<HTMLHeadingElement>(null); // Ref for auto-scaling word display
  const wordContainerRef = useRef<HTMLDivElement>(null); // Ref for word container
  const [wordFontSize, setWordFontSize] = useState<string | null>(null); // Custom font size for long words
  
  // Sound feedback using enhanced audio system
  const soundCorrect = () => {
    console.log('soundCorrect called, soundEnabled:', store.soundEnabled);
    if (!store.soundEnabled) return;
    playSound('correct');
  };
  
  const soundPass = () => {
    console.log('soundPass called, soundEnabled:', store.soundEnabled);
    if (!store.soundEnabled) return;
    playSound('pass');
  };
  
  // Countdown sounds - tick/tock pattern for 3, 2, 1 and roundEnd for round end
  const soundTick = () => {
    console.log('soundTick called, soundEnabled:', store.soundEnabled);
    if (!store.soundEnabled) return;
    playSound('tick');
  };
  
  const soundTock = () => {
    console.log('soundTock called, soundEnabled:', store.soundEnabled);
    if (!store.soundEnabled) return;
    playSound('tock');
  };
  
  const soundRoundEnd = () => {
    console.log('soundRoundEnd called, soundEnabled:', store.soundEnabled);
    if (!store.soundEnabled) return;
    playSound('roundEnd');
  };
  
  // Haptic feedback functions using Vibration API
  const vibrateCorrect = () => {
    if (!store.hapticEnabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(80); // Single pulse for correct (increased from 50ms)
    }
  };
  
  const vibratePass = () => {
    if (!store.hapticEnabled) return;
    if (navigator.vibrate) {
      navigator.vibrate([50, 40, 50]); // Double pulse pattern for pass (more noticeable)
    }
  };
  
  // Combined feedback - haptic + sound
  const feedbackCorrect = () => {
    vibrateCorrect();
    soundCorrect();
  };
  
  const feedbackPass = () => {
    vibratePass();
    soundPass();
  };
  
  // Keep nextWord ref updated
  useEffect(() => {
    nextWordRef.current = store.nextWord;
  }, [store.nextWord]);

  // Track Zustand hydration status
  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setIsHydrated(true);
      return;
    }
    
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    
    return () => unsubscribe();
  }, []);

  // Run iOS permission probe ONLY after Zustand hydration completes
  useEffect(() => {
    console.log('Permission effect, isHydrated:', isHydrated);
    // Don't run until hydrated
    if (!isHydrated) return;
    
    // Check if this is iOS 13+ requiring permission
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      
      // Check persisted permission from hydrated store
      const persistedPermission = useGameStore.getState().tiltPermissionGranted;
      console.log('iOS device, persisted permission:', persistedPermission);
      
      if (persistedPermission) {
        // Permission was previously granted - skip the probe entirely
        console.log('Setting hasDeviceOrientation = true (from persisted)');
        setHasDeviceOrientation(true);
        setNeedsIOSPermission(false);
        
        // Trigger ready screen if in landscape
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
          showReadyScreen();
        }
      } else {
        // Need to probe for permission - start the 500ms test
        const testHandler = (e: DeviceOrientationEvent) => {
          // We received an orientation event - permission was granted!
          if (permissionProbeTimeoutRef.current) {
            clearTimeout(permissionProbeTimeoutRef.current);
            permissionProbeTimeoutRef.current = null;
          }
          window.removeEventListener("deviceorientation", testHandler);
          permissionProbeHandlerRef.current = null;
          setHasDeviceOrientation(true);
          setNeedsIOSPermission(false);
          store.setTiltPermissionGranted(true);
          
          // Trigger ready screen if in landscape
          const isLandscape = window.innerWidth > window.innerHeight;
          if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
            showReadyScreen();
          }
        };
        permissionProbeHandlerRef.current = testHandler;
        window.addEventListener("deviceorientation", testHandler);
        
        // If no event received within 500ms, permission not granted
        permissionProbeTimeoutRef.current = setTimeout(() => {
          window.removeEventListener("deviceorientation", testHandler);
          permissionProbeHandlerRef.current = null;
          permissionProbeTimeoutRef.current = null;
          setNeedsIOSPermission(true);
          setHasDeviceOrientation(false);
          setWaitingForPermission(true);
        }, 500);
      }
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      // Non-iOS - orientation events are available
      setHasDeviceOrientation(true);
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        showReadyScreen();
      }
    } else {
      // No DeviceOrientationEvent at all - show ready screen anyway
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        showReadyScreen();
      }
    }
    
    // Cleanup probe on unmount
    return () => {
      if (permissionProbeTimeoutRef.current) {
        clearTimeout(permissionProbeTimeoutRef.current);
        permissionProbeTimeoutRef.current = null;
      }
      if (permissionProbeHandlerRef.current) {
        window.removeEventListener("deviceorientation", permissionProbeHandlerRef.current);
        permissionProbeHandlerRef.current = null;
      }
    };
  }, [isHydrated]); // Run when hydration completes

  // When hasDeviceOrientation becomes true (permission granted), start countdown if in landscape
  useEffect(() => {
    if (hasDeviceOrientation && waitingForPermission) {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        setWaitingForPermission(false);
        showReadyScreen();
      }
    }
  }, [hasDeviceOrientation, waitingForPermission]);

  // Ref to prevent multiple onReady calls
  const readyTriggeredRef = useRef(false);
  
  // Reset ready trigger when waiting for ready screen
  useEffect(() => {
    if (isWaitingForReady) {
      readyTriggeredRef.current = false;
    }
  }, [isWaitingForReady]);
  
  // Listen for tilt during ready screen to start countdown
  useEffect(() => {
    console.log('Ready screen tilt effect:', { isWaitingForReady, hasDeviceOrientation });
    if (!isWaitingForReady || !hasDeviceOrientation) return;
    
    console.log('Setting up ready screen tilt listener');

    let readyBaseline: number | null = null;
    const samples: number[] = [];
    const readyThreshold = 20; // Degrees of tilt to trigger ready

    const handleReadyTilt = (event: DeviceOrientationEvent) => {
      // Guard against multiple triggers
      if (readyTriggeredRef.current) return;
      
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      
      // Log first 5 events and then every 20th for debugging
      if (samples.length < 5 || samples.length % 20 === 0) {
        console.log('Ready tilt event:', { gamma, beta, orientationType: screen.orientation?.type, samples: samples.length, baseline: readyBaseline });
      }
      
      // Determine orientation type
      let orientationType: string = 'portrait-primary';
      if (screen.orientation && screen.orientation.type) {
        orientationType = screen.orientation.type;
      }
      
      // Use gamma for landscape mode
      let effectiveTilt = 0;
      if (orientationType === 'landscape-primary' || orientationType === 'landscape-secondary') {
        if (orientationType === 'landscape-secondary') {
          effectiveTilt = gamma;
        } else {
          effectiveTilt = -gamma;
        }
      }
      
      // Collect baseline samples
      if (samples.length < 5) {
        samples.push(effectiveTilt);
        if (samples.length === 5) {
          readyBaseline = samples.reduce((a, b) => a + b, 0) / samples.length;
        }
        return;
      }
      
      if (readyBaseline === null) return;
      
      const tiltDelta = effectiveTilt - readyBaseline;
      
      // Either direction tilt = ready to start (user requested either way to acknowledge)
      if (Math.abs(tiltDelta) >= readyThreshold) {
        readyTriggeredRef.current = true;
        onReady();
      }
    };

    window.addEventListener("deviceorientation", handleReadyTilt);
    return () => window.removeEventListener("deviceorientation", handleReadyTilt);
  }, [isWaitingForReady, hasDeviceOrientation]);

  // Initialize round when component mounts - prepare deck but don't start playing
  useEffect(() => {
    // Prepare round deck/word if not already done, but don't start playing
    if (!hasStartedRound.current && !store.currentWord) {
      hasStartedRound.current = true;
      setTimeout(() => {
        store.prepareRound();
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
        
        // Permission handling is done by the dedicated hydration-aware effect
        // Only show ready screen here if permission is already confirmed granted
        if (useGameStore.getState().tiltPermissionGranted) {
          showReadyScreen();
        } else if (typeof DeviceOrientationEvent === "undefined" || 
                   typeof (DeviceOrientationEvent as any).requestPermission !== "function") {
          // Non-iOS device - orientation events work without permission
          showReadyScreen();
        }
        // For iOS without permission, the hydration-aware effect handles showing the permission UI
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
    
    // Initial orientation check (just for rotate prompt)
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

    // Note: Permission check is handled by the hydration-aware effect above
    // This mount effect only handles orientation listeners and screen locking

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
          rawGammaBaselineRef.current = null;
          isCalibrating.current = true;
          calibrationSamplesRef.current = [];
          rawGammaSamplesRef.current = [];
          pendingGestureRef.current = null; // Clear any pending gesture on recalibration
          mustReturnToCenterRef.current = false; // Clear return-to-center guard
          setTiltFeedback(null);
        }, cooldownRemaining);
      } else {
        // No cooldown - calibrate immediately
        lastCalibratedTriggerRef.current = calibrationTrigger;
        baselineBetaRef.current = null;
        rawGammaBaselineRef.current = null;
        isCalibrating.current = true;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
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
        // Also store raw gamma baseline for wrap detection
        if (rawGammaSamplesRef.current.length > 0) {
          const rawSum = rawGammaSamplesRef.current.reduce((a, b) => a + b, 0);
          rawGammaBaselineRef.current = rawSum / rawGammaSamplesRef.current.length;
        }
        isCalibrating.current = false;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
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
        rawGammaBaselineRef.current = null;
        isCalibrating.current = true;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
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
      // 
      // The key insight: when phone is held vertically (gamma near ±90), tilting
      // forward causes gamma to wrap across the ±90 boundary. We detect this by
      // checking if gamma suddenly jumped to the opposite extreme.
      // 
      // We use a simple heuristic: if gamma and the previous sample are on opposite
      // extremes (one > 60, other < -60), we're crossing the wrap boundary.
      
      let effectiveTilt = 0;
      if (orientationType === 'landscape-primary' || orientationType === 'landscape-secondary') {
        // Apply wrap correction based on RAW gamma baseline (not the mapped one)
        let unwrappedGamma = gamma;
        
        // Check if we need to unwrap based on raw gamma baseline
        // The raw baseline tells us where "center" is in sensor space
        const rawBaseline = rawGammaBaselineRef.current;
        if (rawBaseline !== null) {
          // Determine if baseline was captured when phone was vertical
          // For landscape-secondary: vertical = raw gamma near +90
          // For landscape-primary: vertical = raw gamma near -90
          const isLandscapeSecondary = orientationType === 'landscape-secondary';
          
          if (isLandscapeSecondary) {
            // landscape-secondary: vertical means raw gamma near +90, wrap happens to -90
            if (rawBaseline > 60 && gamma < -60) {
              unwrappedGamma = 180 + gamma; // -85 → 95
            }
          } else {
            // landscape-primary: vertical means raw gamma near -90, wrap happens to +90
            if (rawBaseline < -60 && gamma > 60) {
              unwrappedGamma = gamma - 180; // 85 → -95
            }
          }
        }
        
        // For both orientations, we want forward tilt = positive delta
        // User testing in landscape-secondary showed:
        // - Vertical: gamma ≈ 89
        // - Forward: gamma wraps to negative (after unwrap: ~95)
        // - Backward: gamma decreases toward 0 (~80)
        // So for landscape-secondary: forward gives higher value = positive delta ✓
        // 
        // For landscape-primary (opposite rotation):
        // - Vertical: gamma ≈ -89
        // - Forward: gamma wraps to positive (after unwrap: ~-95)
        // - Backward: gamma increases toward 0 (~-80)
        // So for landscape-primary: forward gives lower value = negative delta
        // We need to invert to get positive delta for forward
        
        if (orientationType === 'landscape-secondary') {
          effectiveTilt = unwrappedGamma;
        } else {
          effectiveTilt = -unwrappedGamma;
        }
      } else {
        // Portrait: use beta
        effectiveTilt = beta;
      }
      
      // Calibration phase: collect samples to establish baseline
      if (isCalibrating.current) {
        calibrationSamplesRef.current.push(effectiveTilt);
        rawGammaSamplesRef.current.push(gamma); // Also collect raw gamma for wrap detection
        
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
        feedbackCorrect(); // Haptic + sound feedback for tilt
      } else if (tiltDelta < -tiltThresholdRef.current) {
        // Tilted backward (screen away from user) = PASS
        pendingGestureRef.current = false;
        setTiltFeedback("pass");
        feedbackPass(); // Haptic + sound feedback for tilt
      }
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation);
    return () => {
      if (cooldownDeferTimeout) clearTimeout(cooldownDeferTimeout);
      if (graceTimeout) clearTimeout(graceTimeout);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [hasDeviceOrientation, store.isPlaying, isPaused, isCountingDown, calibrationTrigger]);

  // Timer logic - pause during countdown, ready screen, and permission prompt
  useEffect(() => {
    if (store.isPlaying && !isPaused && !isCountingDown && !isWaitingForReady && !waitingForPermission && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.isPlaying, isPaused, isCountingDown, isWaitingForReady, waitingForPermission, timeLeft]);

  // Handle timer expiration
  useEffect(() => {
    if (timeLeft <= 0 && store.isPlaying) {
      store.endRound();
    }
  }, [timeLeft, store.isPlaying]);
  
  // Countdown sounds - tick/tock pattern for last 5 seconds and roundEnd at 0
  const lastSoundTimeRef = useRef<number | null>(null);
  useEffect(() => {
    // Only play sounds when playing and not counting down, waiting for ready, waiting for permission, or showing rotate prompt
    if (!store.isPlaying || isPaused || isCountingDown || isWaitingForReady || waitingForPermission || showRotatePrompt) return;
    
    // Avoid playing the same sound twice for the same timeLeft value
    if (lastSoundTimeRef.current === timeLeft) return;
    lastSoundTimeRef.current = timeLeft;
    
    // Play tick for odd seconds (5, 3, 1), tock for even seconds (4, 2)
    if (timeLeft === 5 || timeLeft === 3 || timeLeft === 1) {
      soundTick();
    } else if (timeLeft === 4 || timeLeft === 2) {
      soundTock();
    } else if (timeLeft === 0) {
      // Skip roundEnd sound on the final round (drumroll plays on summary instead)
      const isLastRound = store.currentRound >= store.totalRounds;
      if (!isLastRound) {
        soundRoundEnd();
      }
    }
  }, [timeLeft, store.isPlaying, isPaused, isCountingDown, isWaitingForReady, waitingForPermission, showRotatePrompt, store.currentRound, store.totalRounds]);

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

  const handleCorrect = async () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    pendingGestureRef.current = null; // Clear any pending tilt gesture
    mustReturnToCenterRef.current = true; // Require return to center before next tilt gesture
    setTiltFeedback("correct");
    await initAudioContext(); // Initialize audio on user gesture for iOS
    feedbackCorrect(); // Haptic + sound feedback
    store.nextWord(true);
    setTimeout(() => {
      setTiltFeedback(null);
      setIsProcessing(false);
    }, 300);
  };

  const handlePass = async () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    pendingGestureRef.current = null; // Clear any pending tilt gesture
    mustReturnToCenterRef.current = true; // Require return to center before next tilt gesture
    setTiltFeedback("pass");
    await initAudioContext(); // Initialize audio on user gesture for iOS
    feedbackPass(); // Haptic + sound feedback
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
    // Initialize audio context on user gesture for iOS compatibility
    await initAudioContext();
    
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
          store.setTiltPermissionGranted(true);
          
          // Now show ready screen
          if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
            showReadyScreen();
          }
        } else {
          // Permission denied - still show ready screen, just without tilt
          setWaitingForPermission(false);
          setNeedsIOSPermission(false);
          if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
            showReadyScreen();
          }
        }
      } catch (e) {
        // Permission denied - still show ready screen
        setWaitingForPermission(false);
        if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
          showReadyScreen();
        }
      }
    }
  };

  // Function to show the ready screen before countdown
  const showReadyScreen = () => {
    setIsWaitingForReady(true);
  };

  // Function called when user is ready (tilt or button press)
  const onReady = async () => {
    await initAudioContext(); // Initialize audio on user gesture for iOS
    setIsWaitingForReady(false);
    // Don't start round here - it will be started after countdown completes
    startCountdown();
  };
  
  // Function to start the countdown (extracted to be callable from permission handler)
  const startCountdown = () => {
    console.log('startCountdown called');
    // Guard: don't overlap countdowns (use ref to avoid stale closures)
    if (isCountdownActiveRef.current) {
      console.log('startCountdown blocked - already active');
      return;
    }
    isCountdownActiveRef.current = true;
    
    // Note: Audio context is initialized from button clicks (requestTiltPermission, handleCorrect, handlePass)
    // NOT here, because startCountdown can be triggered by orientation changes which are not user gestures
    
    // Clear any existing timeouts
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    countdownTimeoutsRef.current = [];
    
    // Reset calibration for new round
    baselineBetaRef.current = null;
    calibrationSamplesRef.current = [];
    isCalibrating.current = false;
    
    setIsCountingDown(true);
    setCountdown(3);
    
    // Play countdown sound at start of countdown sequence
    if (store.soundEnabled) {
      playSound('countdown');
    }
    
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
      // Countdown complete - now start playing
      if (!store.isPlaying) {
        store.beginRound();
      }
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
            onClick={async () => {
              await initAudioContext(); // Initialize audio on user gesture
              setWaitingForPermission(false);
              setNeedsIOSPermission(false);
              showReadyScreen();
            }}
            className="text-muted-foreground"
          >
            Skip (use buttons instead)
          </Button>
        </div>
      )}

      {/* Ready Screen Overlay - shown before countdown */}
      {isWaitingForReady && !showRotatePrompt && !waitingForPermission && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-between p-8">
          {/* Top spacer for balance */}
          <div className="flex-1" />
          
          {/* Dramatic Round Number - centered and huge */}
          <div className="flex flex-col items-center text-center animate-bounce-in">
            <h1 className="text-7xl font-thin tracking-wide transform -rotate-2 leading-none mb-6">
              <span className="text-pink-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>R</span>
              <span className="text-cyan-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>o</span>
              <span className="text-yellow-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>u</span>
              <span className="text-green-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>n</span>
              <span className="text-purple-400" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>d</span>
            </h1>
            <span className="text-[14rem] font-thin text-yellow-400 leading-none" style={{ fontFamily: 'var(--font-display)', textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
              {store.currentRound || 1}
            </span>
          </div>
          
          {/* Bottom section with instructions and Play button */}
          <div className="flex-1 flex flex-col items-center justify-end pb-8 space-y-6">
            {/* Tilt instructions - only on devices with orientation support */}
            {hasDeviceOrientation && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Smartphone className="w-6 h-6 animate-bounce" style={{ animationDuration: '1.5s' }} />
                <span className="text-lg">Tilt forward to start</span>
              </div>
            )}
            {/* Play button - always available as fallback */}
            <Button 
              onClick={onReady}
              size="lg"
              className="text-2xl px-12 py-8 rounded-xl bg-pink-500 hover:bg-pink-400 text-white border-2 border-pink-400 font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-8 h-8 mr-3" />
              Play
            </Button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-center animate-bounce-in" key={countdown}>
            <h1 className="text-[14rem] font-thin text-yellow-400 leading-none" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
              {countdown}
            </h1>
          </div>
        </div>
      )}

      {/* Home Button - Top Left Corner */}
      <button 
        onClick={() => {
          store.resetGame();
          setLocation("/");
        }}
        className="absolute top-2 left-2 z-30 p-2 rounded-full bg-card/80 hover:bg-card border border-border shadow-lg hover:scale-110 transition-transform"
        data-testid="button-home"
      >
        <Home className="w-5 h-5 text-foreground" />
      </button>

      {/* Left Bar - Timer & Score */}
      <div className="flex flex-col w-auto h-full px-4 py-6 gap-4 border-r border-border justify-center items-center z-20">
        <div className={cn(
          "font-black font-mono tracking-tighter text-5xl tabular-nums",
          timeLeft <= 10 ? "text-destructive animate-pulse" : "text-primary"
        )}>
          {String(timeLeft).padStart(2, '\u00A0')}s
        </div>

        <div className="font-black font-mono text-5xl text-accent tabular-nums">
          {store.currentScore}
        </div>
      </div>


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
        <div 
          ref={wordContainerRef}
          className="bg-card rounded-3xl border-4 border-border flex items-center justify-center p-6 md:p-8 lg:px-16 shadow-2xl relative group w-auto min-w-[50%] max-w-[95%] h-full"
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

      {/* Controls - conditionally rendered based on showButtons setting */}
      {store.showButtons && (
        <div className="flex flex-col w-auto h-full z-20">
          <button 
            onClick={handlePass}
            disabled={isProcessing || !store.isPlaying || isCountingDown}
            data-testid="button-pass"
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
            data-testid="button-correct"
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
      )}
    </div>
  );
}
