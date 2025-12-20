import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { initAudioContext } from "@/lib/audio";
import { Play, Settings as SettingsIcon, Share, List } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const startGame = useGameStore(state => state.startGame);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [tiltPermissionGranted, setTiltPermissionGranted] = useState(false);

  useEffect(() => {
    // Detect iOS/iPadOS (iPadOS reports as Macintosh, so also check for touch support)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIPadOS = navigator.userAgent.includes('Macintosh') && 
                     navigator.maxTouchPoints > 1;
    setIsIOS(isIOSDevice || isIPadOS);
    // Check if running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    
    // Check if device orientation is already available (non-iOS or permission already granted)
    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission !== "function") {
        // Non-iOS - permission not required
        setTiltPermissionGranted(true);
      }
    }
  }, []);

  const requestTiltPermission = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && 
        typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === "granted") {
          setTiltPermissionGranted(true);
          return true;
        }
      } catch (e) {
        console.log("Tilt permission denied:", e);
      }
    }
    return false;
  };

  const handleStart = async () => {
    // Start audio init but DON'T await yet - iOS requires tilt permission to be
    // requested synchronously within the user gesture (any await before it breaks it)
    const audioPromise = initAudioContext();
    
    // Request tilt permission first (iOS only) - must happen synchronously in click handler
    if (!tiltPermissionGranted) {
      await requestTiltPermission();
    }
    
    // Now await audio initialization and verify it's running
    const ctx = await audioPromise;
    console.log('Home: Audio context after init:', ctx?.state);
    
    // If context is still suspended, try one more resume within this gesture
    if (ctx && ctx.state === 'suspended') {
      console.log('Home: Context still suspended, trying extra resume...');
      try {
        await ctx.resume();
        console.log('Home: After extra resume, state:', ctx.state);
      } catch (e) {
        console.log('Home: Extra resume failed:', e);
      }
    }
    
    // Request fullscreen for immersive experience
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      // Fullscreen not supported or denied, continue anyway
      console.log("Fullscreen not available:", err);
    }
    
    startGame();
    setLocation("/game");
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-card overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
         <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center justify-center max-w-md w-full text-center gap-6">
        <div className="animate-bounce-in">
          <h1 className="text-5xl font-thin tracking-wide transform -rotate-2 leading-none">
            <span className="block text-pink-400">Family</span>
            <span className="block text-cyan-400">Guess</span>
            <span className="block text-yellow-400">Party</span>
            <span className="block text-green-400">Fun</span>
            <span className="block text-purple-400">Time</span>
          </h1>
        </div>

        <div className="grid gap-3 w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* iOS hint to add to home screen for fullscreen experience */}
          {isIOS && !isStandalone && (
            <div className="bg-card/80 backdrop-blur rounded-xl p-4 text-sm text-muted-foreground flex items-center gap-3 border border-border">
              <Share className="w-5 h-5 flex-shrink-0" />
              <span>For the best fullscreen experience, tap the share button and "Add to Home Screen"</span>
            </div>
          )}
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-pink-500 hover:bg-pink-400 text-white border-2 border-pink-400"
            onClick={handleStart}
            data-testid="button-play"
          >
            <Play className="mr-2 w-5 h-5 fill-current" />
            Play Now
          </Button>

          <Link href="/categories">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-cyan-400"
              data-testid="button-categories"
            >
              <List className="mr-2 w-5 h-5" />
              Categories
            </Button>
          </Link>

          <Link href="/settings">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-purple-600 hover:bg-purple-500 text-white border-2 border-purple-400"
              data-testid="button-settings"
            >
              <SettingsIcon className="mr-2 w-5 h-5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
