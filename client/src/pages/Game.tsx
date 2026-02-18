import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/store";
import { RainbowText } from "@/components/ui/game-ui";
import { Check, X, Home, Play, Smartphone, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { initAudioContext, playSound } from "@/lib/audio";
import { hapticCorrect, hapticPass } from "@/lib/haptics";
import { useTiltDetection } from "@/hooks/use-tilt-detection";
import { needsPermissionRequest, requestOrientationPermission, isOrientationSupported } from "@/lib/orientation";

export default function Game() {
  const [, setLocation] = useLocation();
  const store = useGameStore();
  
  const isInfiniteTimer = store.roundDuration === 0;
  const [timeLeft, setTimeLeft] = useState(store.roundDuration === 0 ? 0 : store.roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [hasDeviceOrientation, setHasDeviceOrientation] = useState(store.tiltPermissionGranted);
  const [isHydrated, setIsHydrated] = useState(useGameStore.persist.hasHydrated());
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [countdown, setCountdown] = useState<number | "Go!" | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [waitingForPermission, setWaitingForPermission] = useState(false);
  const [isWaitingForReady, setIsWaitingForReady] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const [showTeamScore, setShowTeamScore] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orientationAngleRef = useRef(0);
  const hasStartedRound = useRef(false);
  const wasInPortrait = useRef(true);
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isCountdownActiveRef = useRef(false);
  const hasShownInitialCountdownRef = useRef(false);
  const permissionGrantedTimeRef = useRef(0);
  const nextWordRef = useRef(store.nextWord);
  const permissionProbeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const permissionProbeHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const wordDisplayRef = useRef<HTMLHeadingElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const [wordFontSize, setWordFontSize] = useState<string | null>(null);
  
  const soundCorrect = () => {
    if (!store.soundEnabled) return;
    playSound('correct', store.soundVolume);
  };
  
  const soundPass = () => {
    if (!store.soundEnabled) return;
    playSound('pass', store.soundVolume);
  };
  
  const soundTick = () => {
    if (!store.soundEnabled) return;
    playSound('tick', store.soundVolume);
  };
  
  const soundTock = () => {
    if (!store.soundEnabled) return;
    playSound('tock', store.soundVolume);
  };
  
  const soundRoundEnd = () => {
    if (!store.soundEnabled) return;
    playSound('roundEnd', store.soundVolume);
  };
  
  // Combined feedback - haptic + sound (haptics now use platform abstraction)
  const feedbackCorrect = () => {
    if (store.hapticEnabled) hapticCorrect();
    soundCorrect();
  };
  
  const feedbackPass = () => {
    if (store.hapticEnabled) hapticPass();
    soundPass();
  };

  const {
    tiltFeedback,
    setTiltFeedback,
    calibrationTrigger,
    setCalibrationTrigger,
    lastTiltTimeRef,
    mustReturnToCenterRef,
    pendingGestureRef,
    baselineBetaRef,
    calibrationSamplesRef,
    isCalibratingRef,
  } = useTiltDetection({
    isPlaying: store.isPlaying,
    isPaused,
    isCountingDown,
    isWaitingForReady,
    hasDeviceOrientation,
    onTiltCorrect: feedbackCorrect,
    onTiltPass: feedbackPass,
    onTiltReturn: (wasCorrect: boolean) => {
      nextWordRef.current(wasCorrect);
    },
    onReady: () => {
      onReady();
    },
  });
  
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
    // Don't run until hydrated
    if (!isHydrated) return;
    
    if (needsPermissionRequest()) {
      const testHandler = (e: DeviceOrientationEvent) => {
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
      
      // If no event received within 500ms, need permission (even if previously granted)
      permissionProbeTimeoutRef.current = setTimeout(() => {
        window.removeEventListener("deviceorientation", testHandler);
        permissionProbeHandlerRef.current = null;
        permissionProbeTimeoutRef.current = null;
        setNeedsIOSPermission(true);
        setHasDeviceOrientation(false);
        setWaitingForPermission(true);
      }, 500);
    } else if (isOrientationSupported()) {
      setHasDeviceOrientation(true);
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        showReadyScreen();
      }
    } else {
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
    setTimeLeft(store.roundDuration === 0 ? 0 : store.roundDuration);

    const lockToLandscape = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape-primary');
          setShowRotatePrompt(false);
        }
      } catch (e) {
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape');
            setShowRotatePrompt(false);
          }
        } catch (e2) {}
      }
    };

    // Check if device is in landscape and prompt to rotate if not
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      
      // If in landscape and we haven't shown the initial countdown yet
      if (isLandscape && !hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        wasInPortrait.current = false;
        
        // Lock to current landscape orientation when we enter landscape
        lockToLandscape();
        
        // Permission handling is done by the dedicated hydration-aware effect
        // Only show ready screen here if permission is already confirmed granted
        if (useGameStore.getState().tiltPermissionGranted) {
          showReadyScreen();
        } else if (!needsPermissionRequest()) {
          showReadyScreen();
        }
        // For iOS without permission, the hydration-aware effect handles showing the permission UI
      } else if (!isLandscape) {
        // Entering portrait
        if (!wasInPortrait.current) {
          // Was in landscape, now in portrait - mark baseline invalid
          wasInPortrait.current = true;
          baselineBetaRef.current = null;
          isCalibratingRef.current = false;
          calibrationSamplesRef.current = [];
        }
      }
      
      // When returning to landscape from portrait (after initial countdown has played),
      // bump trigger to force recalibration and re-lock orientation
      if (isLandscape && wasInPortrait.current && hasShownInitialCountdownRef.current) {
        wasInPortrait.current = false;
        setCalibrationTrigger(prev => prev + 1);
        lockToLandscape();
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

  // Timer logic - pause during countdown, ready screen, and permission prompt
  useEffect(() => {
    if (!isInfiniteTimer && store.isPlaying && !isPaused && !isCountingDown && !isWaitingForReady && !isHandoff && !showTeamScore && !waitingForPermission && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [store.isPlaying, isPaused, isCountingDown, isWaitingForReady, isHandoff, showTeamScore, waitingForPermission, timeLeft, isInfiniteTimer]);

  // Handle timer expiration
  useEffect(() => {
    if (!isInfiniteTimer && timeLeft <= 0 && store.isPlaying) {
      store.endRound();
    }
  }, [timeLeft, store.isPlaying, isInfiniteTimer]);

  // Handle team transition in team mode (when not all teams have played yet)
  const teamTransitionPendingRef = useRef(false);
  useEffect(() => {
    const freshState = useGameStore.getState();
    const timerExpired = !isInfiniteTimer && timeLeft <= 0;
    const deckExhausted = isInfiniteTimer && !freshState.isPlaying && freshState.roundResults.length > 0;
    if (!freshState.isPlaying && !freshState.isRoundOver && !freshState.isGameFinished && (timerExpired || deckExhausted) && !teamTransitionPendingRef.current) {
      teamTransitionPendingRef.current = true;
      if (deckExhausted && freshState.numberOfTeams <= 1) {
        const isLastRound = freshState.currentRound >= freshState.totalRounds;
        if (isLastRound) {
          freshState.prepareRound();
        } else {
          useGameStore.setState({ isRoundOver: true });
        }
        teamTransitionPendingRef.current = false;
      } else {
        setShowTeamScore(true);
      }
    }
  }, [store.isPlaying, store.isRoundOver, store.isGameFinished, timeLeft, isInfiniteTimer]);

  // When currentTeam changes (after prepareRound advances team), reset for next team's turn
  const prevTeamRef = useRef(store.currentTeam);
  useEffect(() => {
    if (prevTeamRef.current !== store.currentTeam && teamTransitionPendingRef.current) {
      teamTransitionPendingRef.current = false;
      prevTeamRef.current = store.currentTeam;
      setTimeLeft(store.roundDuration === 0 ? 0 : store.roundDuration);
      isCountdownActiveRef.current = false;
      hasShownInitialCountdownRef.current = false;
      setIsWaitingForReady(false);
      setIsHandoff(true);
    } else if (prevTeamRef.current !== store.currentTeam) {
      prevTeamRef.current = store.currentTeam;
    }
  }, [store.currentTeam, store.roundDuration]);
  
  // Countdown sounds - tick/tock pattern for last 5 seconds and roundEnd at 0
  const lastSoundTimeRef = useRef<number | null>(null);
  useEffect(() => {
    // Only play sounds when playing and not counting down, waiting for ready, waiting for permission, or showing rotate prompt
    if (!store.isPlaying || isPaused || isCountingDown || isWaitingForReady || isHandoff || showTeamScore || waitingForPermission || showRotatePrompt || isInfiniteTimer) return;
    
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
  }, [timeLeft, store.isPlaying, isPaused, isCountingDown, isWaitingForReady, isHandoff, showTeamScore, waitingForPermission, showRotatePrompt, store.currentRound, store.totalRounds]);

  // Handle Game Over / Round End Redirect
  useEffect(() => {
    if (store.isRoundOver || store.isGameFinished) {
      setLocation("/summary");
    }
  }, [store.isRoundOver, store.isGameFinished, setLocation]);

  // Get font size based on word length - simpler and faster than canvas measurement
  const getWordFontSize = (word: string): string | null => {
    if (!word) return null;
    
    // Find the longest single word (for multi-word phrases)
    const words = word.split(' ');
    const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
    const len = longestWord.length;
    
    // Scale font size based on character count
    // Base size uses clamp(2rem, 10vw, 9rem) from CSS, we override for long words
    if (len <= 8) return null; // Use default CSS size
    if (len <= 10) return 'clamp(1.8rem, 8vw, 7rem)'; // ~85% 
    if (len <= 12) return 'clamp(1.5rem, 7vw, 5.5rem)'; // ~70%
    if (len <= 14) return 'clamp(1.3rem, 6vw, 4.5rem)'; // ~60%
    if (len <= 16) return 'clamp(1.1rem, 5vw, 3.5rem)'; // ~50%
    return 'clamp(1rem, 4vw, 3rem)'; // Very long words ~40%
  };

  // Update font size when word changes
  useEffect(() => {
    if (!store.currentWord) {
      setWordFontSize(null);
      return;
    }
    setWordFontSize(getWordFontSize(store.currentWord));
  }, [store.currentWord]);

  const handleCorrect = async () => {
    if (isProcessing || !store.isPlaying || isCountingDown) return;
    setIsProcessing(true);
    pendingGestureRef.current = null; // Clear any pending tilt gesture
    mustReturnToCenterRef.current = true; // Require return to center before next tilt gesture
    setTiltFeedback("correct");
    initAudioContext(); // Initialize audio on user gesture for iOS
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
    initAudioContext(); // Initialize audio on user gesture for iOS
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
    initAudioContext();
    
    try {
      const granted = await requestOrientationPermission();
      if (granted) {
        permissionGrantedTimeRef.current = Date.now();
        lastTiltTimeRef.current = Date.now() + 5000;
        
        setHasDeviceOrientation(true);
        setNeedsIOSPermission(false);
        setWaitingForPermission(false);
        store.setTiltPermissionGranted(true);
        
        if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
          showReadyScreen();
        }
      } else {
        setWaitingForPermission(false);
        setNeedsIOSPermission(false);
        if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
          showReadyScreen();
        }
      }
    } catch {
      setWaitingForPermission(false);
      if (!hasShownInitialCountdownRef.current && !isCountdownActiveRef.current) {
        showReadyScreen();
      }
    }
  };

  const scoreDismissedRef = useRef(false);
  const handleScoreDismiss = () => {
    if (scoreDismissedRef.current) return;
    scoreDismissedRef.current = true;
    setShowTeamScore(false);
    const freshState = useGameStore.getState();
    const isLastTeam = freshState.currentTeam >= freshState.numberOfTeams;
    if (isLastTeam) {
      if (freshState.currentRound >= freshState.totalRounds) {
        freshState.prepareRound();
      } else {
        useGameStore.setState({ isRoundOver: true });
      }
    } else {
      freshState.prepareRound();
    }
  };

  useEffect(() => {
    if (!showTeamScore) {
      scoreDismissedRef.current = false;
    }
  }, [showTeamScore]);

  const showHandoffScreen = () => {
    setIsWaitingForReady(false);
    setIsHandoff(true);
  };

  const handleHandoffConfirm = () => {
    initAudioContext();
    setIsHandoff(false);
    setIsWaitingForReady(true);
  };

  const showReadyScreen = () => {
    showHandoffScreen();
  };

  // Function called when user is ready (tilt or button press)
  const onReady = async () => {
    initAudioContext(); // Initialize audio on user gesture for iOS
    setIsWaitingForReady(false);
    // Don't start round here - it will be started after countdown completes
    startCountdown();
  };
  
  // Function to start the countdown (extracted to be callable from permission handler)
  const startCountdown = () => {
    // Guard: don't overlap countdowns (use ref to avoid stale closures)
    if (isCountdownActiveRef.current) return;
    isCountdownActiveRef.current = true;
    
    // Note: Audio context is initialized from button clicks (requestTiltPermission, handleCorrect, handlePass)
    // NOT here, because startCountdown can be triggered by orientation changes which are not user gestures
    
    // Clear any existing timeouts
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    countdownTimeoutsRef.current = [];
    
    // Reset calibration for new round
    baselineBetaRef.current = null;
    calibrationSamplesRef.current = [];
    isCalibratingRef.current = false;
    
    setIsCountingDown(true);
    setCountdown(3);
    
    // Play countdown sound at start of countdown sequence
    if (store.soundEnabled) {
      playSound('countdown', store.soundVolume);
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
          <RotateCw className="w-24 h-24 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-3xl font-black text-primary text-center">Please Rotate Your Device</h2>
          <p className="text-muted-foreground text-center text-lg">Turn your phone sideways to play in landscape mode</p>
        </div>
      )}

      {/* iOS Permission Overlay - shown before countdown, highest z-index for clickability */}
      {waitingForPermission && !showRotatePrompt && (
        <div className="absolute inset-0 z-[60] bg-background flex flex-col items-center justify-center space-y-8 p-8 pointer-events-auto">
          <Smartphone className="w-24 h-24 text-primary" />
          <h2 className="text-3xl font-black text-primary text-center">Enable Tilt Gestures</h2>
          <p className="text-muted-foreground text-center text-lg max-w-md">
            Tap the button below to enable tilt gestures for a hands-free experience
          </p>
          <button 
            onClick={requestTiltPermission}
            className="text-xl px-10 py-5 rounded-2xl bg-pink-500 hover:bg-pink-400 active:bg-pink-600 text-white border-2 border-pink-400 shadow-lg hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-3"
            data-testid="button-enable-tilt"
          >
            <Smartphone className="w-6 h-6" />
            <span className="font-display text-shadow-sm">Enable Tilt Gestures</span>
          </button>
          <button 
            onClick={() => {
              initAudioContext();
              setWaitingForPermission(false);
              setNeedsIOSPermission(false);
              showReadyScreen();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto px-6 py-3"
            data-testid="button-skip-tilt"
          >
            Skip (use buttons instead)
          </button>
        </div>
      )}

      {/* Team Score Screen - shown after a team's turn ends */}
      {showTeamScore && !showRotatePrompt && (() => {
        const scoreTeamColor = store.getTeamColor(store.currentTeam);
        const scoreTeamName = store.getTeamName(store.currentTeam);
        const teamIdx = store.currentTeam - 1;
        const scoreCorrect = store.teamRoundScores[teamIdx]?.correct ?? 0;
        const scoreNameWords = scoreTeamName.split(' ');
        return (
          <div 
            className="absolute inset-0 z-[55] bg-background cursor-pointer"
            onClick={handleScoreDismiss}
            data-testid="team-score-screen"
          >
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex flex-row items-center justify-center px-8">
                {/* Left: Team name - one line per word */}
                <div className="flex-1 flex items-center justify-center animate-bounce-in">
                  <div className="flex flex-col items-center" data-testid="text-team-score-name">
                    {scoreNameWords.map((word, i) => (
                      <span key={i} className={`text-7xl ${scoreTeamColor.text} tracking-wide leading-tight transform -rotate-2 font-display text-shadow-lg`}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Score */}
                <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in">
                  <h1 className="text-5xl font-thin tracking-wide transform -rotate-2 leading-none">
                    <RainbowText text="Score" />
                  </h1>
                  <span className="text-[10rem] font-thin text-yellow-400 leading-none mt-2 font-display text-shadow-md" data-testid="text-team-score-count">{scoreCorrect}</span>
                </div>
              </div>

              {/* Bottom: Tap to continue */}
              <div className="pb-6 flex items-center justify-center gap-3 text-muted-foreground">
                <span className="text-base animate-pulse">Tap to continue</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Handoff Screen Overlay - tap to confirm team has the phone */}
      {isHandoff && !showRotatePrompt && !waitingForPermission && (() => {
        const teamColor = store.getTeamColor(store.currentTeam);
        const teamName = store.getTeamName(store.currentTeam);
        return (
          <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8 p-8">
            <h1 className={`text-6xl font-black ${teamColor.text} tracking-wide text-center text-shadow-lg`} data-testid="text-handoff-team">
              {teamName} Ready?
            </h1>
            <button
              onClick={handleHandoffConfirm}
              className="px-14 py-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-white border-2 border-cyan-400 shadow-lg hover:scale-105 active:scale-95 transition-all"
              data-testid="button-handoff-confirm"
            >
              <span className="text-3xl uppercase tracking-widest font-display text-shadow-sm">Ready!</span>
            </button>
          </div>
        );
      })()}

      {/* Ready Screen Overlay - shown before countdown */}
      {isWaitingForReady && !showRotatePrompt && !waitingForPermission && !isHandoff && (() => {
        const readyTeamColor = store.numberOfTeams > 1 ? store.getTeamColor(store.currentTeam) : null;
        const readyTeamName = store.numberOfTeams > 1 ? store.getTeamName(store.currentTeam) : null;
        const readyNameWords = readyTeamName ? readyTeamName.split(' ') : [];
        return (
          <div className="absolute inset-0 z-50 bg-background flex flex-col">
            <div className="flex-1 flex flex-row items-center justify-center px-8">
              {/* Left: Team name - one line per word */}
              {readyTeamColor && readyNameWords.length > 0 && (
                <div className="flex-1 flex items-center justify-center animate-bounce-in">
                  <div className="flex flex-col items-center" data-testid="text-team-ready">
                    {readyNameWords.map((word, i) => (
                      <span key={i} className={`text-7xl ${readyTeamColor.text} tracking-wide leading-tight transform -rotate-2 font-display text-shadow-lg`}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Right: Round number */}
              <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in">
                <h1 className={`${store.numberOfTeams > 1 ? 'text-5xl' : 'text-7xl'} font-thin tracking-wide transform -rotate-2 leading-none`}>
                  <RainbowText text="Round" />
                </h1>
                <span className="text-[10rem] font-thin text-yellow-400 leading-none mt-2 font-display text-shadow-md">
                  {store.currentRound || 1}
                </span>
              </div>
            </div>

            {/* Bottom: Tilt instructions / Play button */}
            <div className="pb-6 flex flex-col items-center justify-center gap-3">
              {hasDeviceOrientation && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Smartphone className="w-5 h-5 animate-bounce" style={{ animationDuration: '1.5s' }} />
                  <span className="text-base">Tilt forward to start</span>
                </div>
              )}
              {store.showButtons && (
                <button 
                  onClick={onReady}
                  className="px-12 py-5 rounded-2xl bg-pink-500 hover:bg-pink-400 active:bg-pink-600 text-white border-2 border-pink-400 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Play className="w-8 h-8 drop-shadow-md" />
                  <span className="text-2xl uppercase tracking-widest font-display text-shadow-sm">Play</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
        {isInfiniteTimer ? (
          <div
            className="font-black text-5xl leading-none select-none"
            style={{
              background: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00cc00, #0088ff, #8800ff, #ff0088)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ∞
          </div>
        ) : (
          <div className={cn(
            "font-black font-mono tracking-tighter text-5xl tabular-nums",
            timeLeft <= 10 ? "text-destructive animate-pulse" : "text-primary"
          )}>
            {String(timeLeft).padStart(2, '\u00A0')}s
          </div>
        )}

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
          className="word-container-fixed bg-card rounded-3xl border-4 border-border flex items-center justify-center p-6 shadow-2xl relative group"
        >
           {/* Card Background Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>
           
           <h1 
             ref={wordDisplayRef}
             className="word-display font-body text-white animate-bounce-in"
             style={wordFontSize ? { fontSize: wordFontSize } : undefined}
           >
             {store.currentWord}
           </h1>
        </div>
      </div>

      {/* Controls - conditionally rendered based on showButtons setting */}
      {store.showButtons && (
        <div className="flex flex-col h-full z-20 gap-3 p-3 justify-center">
          <button 
            onClick={handleCorrect}
            disabled={isProcessing || !store.isPlaying || isCountingDown}
            data-testid="button-correct"
            className={cn(
              "flex-1 bg-green-500 hover:bg-green-400 active:bg-green-600 rounded-[1.5rem] border-2 border-green-400 shadow-lg transition-all flex items-center justify-center group active:scale-95 w-20",
              (isProcessing || !store.isPlaying || isCountingDown) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Check className="w-12 h-12 text-white group-active:scale-90 transition-transform drop-shadow-md" strokeWidth={3} />
          </button>
          <button 
            onClick={handlePass}
            disabled={isProcessing || !store.isPlaying || isCountingDown}
            data-testid="button-pass"
            className={cn(
              "flex-1 bg-red-500 hover:bg-red-400 active:bg-red-600 rounded-[1.5rem] border-2 border-red-400 shadow-lg transition-all flex items-center justify-center group active:scale-95 w-20",
              (isProcessing || !store.isPlaying || isCountingDown) && "opacity-50 cursor-not-allowed"
            )}
          >
            <X className="w-12 h-12 text-white group-active:scale-90 transition-transform drop-shadow-md" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
