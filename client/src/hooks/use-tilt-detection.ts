import { useEffect, useState, useRef } from "react";
import { startOrientationTracking, type OrientationData } from "@/lib/orientation";

interface UseTiltDetectionOptions {
  isPlaying: boolean;
  isPaused: boolean;
  isCountingDown: boolean;
  isWaitingForReady: boolean;
  hasDeviceOrientation: boolean;
  onTiltCorrect: () => void;
  onTiltPass: () => void;
  onTiltReturn: (wasCorrect: boolean) => void;
  onReady: () => void;
}

interface UseTiltDetectionReturn {
  tiltFeedback: "correct" | "pass" | null;
  setTiltFeedback: (feedback: "correct" | "pass" | null) => void;
  calibrationTrigger: number;
  setCalibrationTrigger: React.Dispatch<React.SetStateAction<number>>;
  lastTiltTimeRef: React.MutableRefObject<number>;
  mustReturnToCenterRef: React.MutableRefObject<boolean>;
  pendingGestureRef: React.MutableRefObject<boolean | null>;
  baselineBetaRef: React.MutableRefObject<number | null>;
  calibrationSamplesRef: React.MutableRefObject<number[]>;
  isCalibratingRef: React.MutableRefObject<boolean>;
}

export function useTiltDetection({
  isPlaying,
  isPaused,
  isCountingDown,
  isWaitingForReady,
  hasDeviceOrientation,
  onTiltCorrect,
  onTiltPass,
  onTiltReturn,
  onReady,
}: UseTiltDetectionOptions): UseTiltDetectionReturn {
  const [tiltFeedback, setTiltFeedback] = useState<"correct" | "pass" | null>(null);
  const [calibrationTrigger, setCalibrationTrigger] = useState(0);

  const tiltThresholdRef = useRef(25);
  const lastTiltTimeRef = useRef(0);
  const baselineBetaRef = useRef<number | null>(null);
  const rawGammaBaselineRef = useRef<number | null>(null);
  const calibrationSamplesRef = useRef<number[]>([]);
  const rawGammaSamplesRef = useRef<number[]>([]);
  const isCalibratingRef = useRef(false);
  const pendingGestureRef = useRef<boolean | null>(null);
  const returnThresholdRef = useRef(10);
  const mustReturnToCenterRef = useRef(false);
  const lastOrientationTypeRef = useRef<string | null>(null);
  const lastCalibratedTriggerRef = useRef<number>(-1);

  const onTiltCorrectRef = useRef(onTiltCorrect);
  const onTiltPassRef = useRef(onTiltPass);
  const onTiltReturnRef = useRef(onTiltReturn);
  const onReadyRef = useRef(onReady);

  useEffect(() => { onTiltCorrectRef.current = onTiltCorrect; }, [onTiltCorrect]);
  useEffect(() => { onTiltPassRef.current = onTiltPass; }, [onTiltPass]);
  useEffect(() => { onTiltReturnRef.current = onTiltReturn; }, [onTiltReturn]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  const readyTriggeredRef = useRef(false);

  useEffect(() => {
    if (isWaitingForReady) {
      readyTriggeredRef.current = false;
    }
  }, [isWaitingForReady]);

  useEffect(() => {
    if (!isWaitingForReady || !hasDeviceOrientation) return;

    let readyBaseline: number | null = null;
    let samples: number[] = [];
    let lastOrientationType: string = '';
    const BASELINE_SAMPLE_COUNT = 15;
    const readyThreshold = 35;
    const centerTolerance = 10;
    let phoneSettled = false;
    let tiltEnabled = false;
    let enableTimerId: ReturnType<typeof setTimeout> | null = null;
    let holdStartTime: number | null = null;
    const HOLD_DURATION_MS = 250;

    const resetState = () => {
      samples = [];
      readyBaseline = null;
      phoneSettled = false;
      tiltEnabled = false;
      holdStartTime = null;
      if (enableTimerId) {
        clearTimeout(enableTimerId);
        enableTimerId = null;
      }
    };

    const handleReadyTilt = (data: OrientationData) => {
      if (readyTriggeredRef.current) return;
      
      const gamma = data.gamma || 0;
      
      const isLandscape = window.innerWidth > window.innerHeight;
      if (!isLandscape) {
        resetState();
        lastOrientationType = '';
        return;
      }
      
      let orientationType: string = 'landscape-primary';
      if (screen.orientation && screen.orientation.type) {
        orientationType = screen.orientation.type;
      } else if (typeof (window as any).orientation === 'number') {
        const angle = (window as any).orientation;
        if (angle === 90) {
          orientationType = 'landscape-primary';
        } else if (angle === -90 || angle === 270) {
          orientationType = 'landscape-secondary';
        }
      }
      
      if (orientationType !== lastOrientationType) {
        resetState();
        lastOrientationType = orientationType;
      }
      
      let effectiveTilt = 0;
      if (orientationType === 'landscape-secondary') {
        effectiveTilt = gamma;
      } else {
        effectiveTilt = -gamma;
      }
      
      if (samples.length < BASELINE_SAMPLE_COUNT) {
        samples.push(effectiveTilt);
        if (samples.length === BASELINE_SAMPLE_COUNT) {
          readyBaseline = samples.reduce((a, b) => a + b, 0) / samples.length;
        }
        return;
      }
      
      if (readyBaseline === null) return;
      
      const tiltDelta = effectiveTilt - readyBaseline;
      
      if (!phoneSettled) {
        if (Math.abs(tiltDelta) <= centerTolerance) {
          phoneSettled = true;
          enableTimerId = setTimeout(() => {
            tiltEnabled = true;
          }, 1200);
        }
        return;
      }
      
      if (!tiltEnabled) return;
      
      if (Math.abs(tiltDelta) >= readyThreshold) {
        if (holdStartTime === null) {
          holdStartTime = Date.now();
        } else if (Date.now() - holdStartTime >= HOLD_DURATION_MS) {
          readyTriggeredRef.current = true;
          onReadyRef.current();
        }
      } else {
        holdStartTime = null;
      }
    };

    const stopTracking = startOrientationTracking(handleReadyTilt);
    return () => {
      if (enableTimerId) clearTimeout(enableTimerId);
      stopTracking();
    };
  }, [isWaitingForReady, hasDeviceOrientation]);

  useEffect(() => {
    const isLandscape = window.innerWidth > window.innerHeight;
    if (!hasDeviceOrientation || !isPlaying || isPaused || isCountingDown || !isLandscape) return;
    
    const needsCalibration = lastCalibratedTriggerRef.current !== calibrationTrigger;
    
    let cooldownDeferTimeout: NodeJS.Timeout | null = null;
    
    if (needsCalibration) {
      const now = Date.now();
      const timeSinceLastTilt = now - lastTiltTimeRef.current;
      const cooldownRemaining = 2000 - timeSinceLastTilt;
      
      if (cooldownRemaining > 0) {
        cooldownDeferTimeout = setTimeout(() => {
          const stillLandscape = window.innerWidth > window.innerHeight;
          if (!stillLandscape) return;
          
          lastCalibratedTriggerRef.current = calibrationTrigger;
          baselineBetaRef.current = null;
          rawGammaBaselineRef.current = null;
          isCalibratingRef.current = true;
          calibrationSamplesRef.current = [];
          rawGammaSamplesRef.current = [];
          pendingGestureRef.current = null;
          mustReturnToCenterRef.current = false;
          setTiltFeedback(null);
        }, cooldownRemaining);
      } else {
        lastCalibratedTriggerRef.current = calibrationTrigger;
        baselineBetaRef.current = null;
        rawGammaBaselineRef.current = null;
        isCalibratingRef.current = true;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
        pendingGestureRef.current = null;
        mustReturnToCenterRef.current = false;
        setTiltFeedback(null);
      }
    }
    
    let graceTimeout: NodeJS.Timeout | null = null;
    
    const finalizeCalibration = () => {
      if (calibrationSamplesRef.current.length > 0) {
        const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
        baselineBetaRef.current = sum / calibrationSamplesRef.current.length;
        if (rawGammaSamplesRef.current.length > 0) {
          const rawSum = rawGammaSamplesRef.current.reduce((a, b) => a + b, 0);
          rawGammaBaselineRef.current = rawSum / rawGammaSamplesRef.current.length;
        }
        isCalibratingRef.current = false;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
      }
    };

    const handleDeviceOrientation = (data: OrientationData) => {
      const beta = data.beta || 0;
      const gamma = data.gamma || 0;
      
      let orientationType: string = 'portrait-primary';
      if (screen.orientation && screen.orientation.type) {
        orientationType = screen.orientation.type;
      } else if (typeof (window as any).orientation === 'number') {
        const winOrient = (window as any).orientation;
        if (winOrient === 90) orientationType = 'landscape-primary';
        else if (winOrient === -90 || winOrient === 270) orientationType = 'landscape-secondary';
        else orientationType = 'portrait-primary';
      }
      
      if (lastOrientationTypeRef.current !== null && 
          lastOrientationTypeRef.current !== orientationType) {
        baselineBetaRef.current = null;
        rawGammaBaselineRef.current = null;
        isCalibratingRef.current = true;
        calibrationSamplesRef.current = [];
        rawGammaSamplesRef.current = [];
        pendingGestureRef.current = null;
        mustReturnToCenterRef.current = false;
        setTiltFeedback(null);
        lastOrientationTypeRef.current = orientationType;
        setCalibrationTrigger(prev => prev + 1);
        return;
      }
      lastOrientationTypeRef.current = orientationType;
      
      let effectiveTilt = 0;
      if (orientationType === 'landscape-primary' || orientationType === 'landscape-secondary') {
        let unwrappedGamma = gamma;
        
        const rawBaseline = rawGammaBaselineRef.current;
        if (rawBaseline !== null) {
          const isLandscapeSecondary = orientationType === 'landscape-secondary';
          
          if (isLandscapeSecondary) {
            if (rawBaseline > 60 && gamma < -60) {
              unwrappedGamma = 180 + gamma;
            }
          } else {
            if (rawBaseline < -60 && gamma > 60) {
              unwrappedGamma = gamma - 180;
            }
          }
        }
        
        if (orientationType === 'landscape-secondary') {
          effectiveTilt = unwrappedGamma;
        } else {
          effectiveTilt = -unwrappedGamma;
        }
      } else {
        effectiveTilt = beta;
      }
      
      if (isCalibratingRef.current) {
        calibrationSamplesRef.current.push(effectiveTilt);
        rawGammaSamplesRef.current.push(gamma);
        
        if (calibrationSamplesRef.current.length === 1 && !graceTimeout) {
          graceTimeout = setTimeout(finalizeCalibration, 500);
        }
        
        if (calibrationSamplesRef.current.length >= 10) {
          if (graceTimeout) clearTimeout(graceTimeout);
          finalizeCalibration();
        }
        return;
      }
      
      if (baselineBetaRef.current === null) return;
      
      const tiltDelta = effectiveTilt - baselineBetaRef.current;
      const absDelta = Math.abs(tiltDelta);
      const isAtCenter = absDelta <= returnThresholdRef.current;
      
      if (mustReturnToCenterRef.current) {
        if (isAtCenter) {
          mustReturnToCenterRef.current = false;
        }
        return;
      }

      if (pendingGestureRef.current !== null) {
        if (isAtCenter) {
          const wasCorrect = pendingGestureRef.current;
          pendingGestureRef.current = null;
          lastTiltTimeRef.current = Date.now();
          setTiltFeedback(null);
          onTiltReturnRef.current(wasCorrect);
        }
        return;
      }

      if (tiltDelta > tiltThresholdRef.current) {
        pendingGestureRef.current = true;
        setTiltFeedback("correct");
        onTiltCorrectRef.current();
      } else if (tiltDelta < -tiltThresholdRef.current) {
        pendingGestureRef.current = false;
        setTiltFeedback("pass");
        onTiltPassRef.current();
      }
    };

    const stopTracking = startOrientationTracking(handleDeviceOrientation);
    return () => {
      if (cooldownDeferTimeout) clearTimeout(cooldownDeferTimeout);
      if (graceTimeout) clearTimeout(graceTimeout);
      stopTracking();
    };
  }, [hasDeviceOrientation, isPlaying, isPaused, isCountingDown, calibrationTrigger]);

  return {
    tiltFeedback,
    setTiltFeedback,
    calibrationTrigger,
    setCalibrationTrigger,
    lastTiltTimeRef,
    mustReturnToCenterRef,
    pendingGestureRef,
    baselineBetaRef,
    calibrationSamplesRef,
    isCalibratingRef: isCalibratingRef,
  };
}
