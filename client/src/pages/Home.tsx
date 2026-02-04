import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { initAudioContextAsync } from "@/lib/audio";
import { Play, Settings as SettingsIcon, List, HelpCircle } from "lucide-react";
import { BackgroundGlow, TitleStack, menuButtonStyles } from "@/components/ui/game-ui";

function SplashScreen({ onTap }: { onTap: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-card"
      onClick={onTap}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <BackgroundGlow />

      <div className="z-10 flex flex-col items-center justify-center max-w-md w-full text-center gap-8">
        <TitleStack animated />

        <p 
          className="text-xl text-muted-foreground font-light animate-pulse"
          data-testid="text-tap-prompt"
        >
          Tap anywhere to start
        </p>
      </div>
    </motion.div>
  );
}

function MainScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="h-[100dvh] flex flex-col items-center justify-between pt-10 pb-6 px-4 bg-gradient-to-b from-background to-card overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <BackgroundGlow />

      <div className="z-10 flex flex-col items-center max-w-md w-full text-center flex-1 justify-center">
        <TitleStack />
      </div>

      <div className="z-10 grid gap-3 w-full max-w-md px-4">
        <Button 
          size="lg" 
          className={menuButtonStyles.pink}
          onClick={onStart}
          data-testid="button-play"
        >
          <Play className="mr-2 w-5 h-5 fill-current" />
          Play Now
        </Button>

        <Link href="/categories">
          <Button 
            size="lg" 
            className={menuButtonStyles.cyan}
            data-testid="button-categories"
          >
            <List className="mr-2 w-5 h-5" />
            Categories
          </Button>
        </Link>

        <Link href="/settings">
          <Button 
            size="lg" 
            className={menuButtonStyles.purple}
            data-testid="button-settings"
          >
            <SettingsIcon className="mr-2 w-5 h-5" />
            Settings
          </Button>
        </Link>

        <Link href="/how-to-play">
          <Button 
            size="lg" 
            className={menuButtonStyles.yellow}
            data-testid="button-how-to-play"
          >
            <HelpCircle className="mr-2 w-5 h-5" />
            How to Play
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const startGame = useGameStore(state => state.startGame);
  const splashDismissed = useGameStore(state => state.splashDismissed);
  const setSplashDismissed = useGameStore(state => state.setSplashDismissed);

  const handleSplashTap = async () => {
    await initAudioContextAsync();
    setSplashDismissed(true);
  };

  const handleStart = () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } catch (err) {}
    
    startGame();
    setLocation("/game");
  };

  return (
    <div data-testid="home-container">
      <AnimatePresence mode="wait">
        {!splashDismissed ? (
          <SplashScreen key="splash" onTap={handleSplashTap} />
        ) : (
          <MainScreen key="main" onStart={handleStart} />
        )}
      </AnimatePresence>
    </div>
  );
}
