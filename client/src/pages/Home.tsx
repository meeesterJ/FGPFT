import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { Play, Settings as SettingsIcon, Share } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const startGame = useGameStore(state => state.startGame);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
  }, []);

  const handleStart = async () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-card overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
         <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center justify-between min-h-[80vh] max-w-md w-full text-center py-8">
        <div className="space-y-4 animate-bounce-in flex-1 flex items-center">
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent text-stroke drop-shadow-xl tracking-wider transform -rotate-2 leading-tight">
            Family<br/>Guess<br/>Party<br/>Fun<br/>Time
          </h1>
        </div>

        <div className="grid gap-4 w-full animate-slide-up mt-auto" style={{ animationDelay: '0.2s' }}>
          {/* iOS hint to add to home screen for fullscreen experience */}
          {isIOS && !isStandalone && (
            <div className="bg-card/80 backdrop-blur rounded-xl p-4 text-sm text-muted-foreground flex items-center gap-3 border border-border">
              <Share className="w-5 h-5 flex-shrink-0" />
              <span>For the best fullscreen experience, tap the share button and "Add to Home Screen"</span>
            </div>
          )}
          
          <Button 
            size="lg" 
            className="w-full h-20 text-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-white border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1"
            onClick={handleStart}
            data-testid="button-play"
          >
            <Play className="mr-3 w-8 h-8 fill-current" />
            Play Now
          </Button>

          <Link href="/settings">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-16 text-xl font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform border-2 border-border bg-card hover:bg-accent hover:text-accent-foreground"
              data-testid="button-settings"
            >
              <SettingsIcon className="mr-3 w-6 h-6" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
