import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { initAudioContextAsync } from "@/lib/audio";
import { Play, Settings as SettingsIcon, List } from "lucide-react";

const titleWords = [
  { text: "Family", color: "text-pink-400" },
  { text: "Guess", color: "text-cyan-400" },
  { text: "Party", color: "text-yellow-400" },
  { text: "Fun", color: "text-green-400" },
  { text: "Time", color: "text-purple-400" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.22,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: -60,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 600,
      damping: 18,
      mass: 1,
    },
  },
};

// Splash screen overlay with animated title
function SplashScreen({ onTap }: { onTap: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-card"
      onClick={onTap}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center justify-center max-w-md w-full text-center gap-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-7xl font-thin tracking-wide transform -rotate-2 leading-none">
            {titleWords.map((word) => (
              <motion.span
                key={word.text}
                className={`block ${word.color}`}
                variants={wordVariants}
                style={{
                  display: 'block',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                {word.text}
              </motion.span>
            ))}
          </h1>
        </motion.div>

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

// Main screen with static title and buttons
function MainScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="h-[100dvh] flex flex-col items-center justify-between pt-12 pb-8 px-4 bg-gradient-to-b from-background to-card overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-md w-full text-center">
        <h1 className="text-6xl font-thin tracking-wide transform -rotate-2 leading-none">
          {titleWords.map((word) => (
            <span
              key={word.text}
              className={`block ${word.color}`}
              style={{
                display: 'block',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {word.text}
            </span>
          ))}
        </h1>
      </div>

      <div className="z-10 grid gap-3 w-full max-w-md px-4">
        <Button 
          size="lg" 
          className="w-full h-14 text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform bg-pink-500 hover:bg-pink-400 text-white border-2 border-pink-400"
          onClick={onStart}
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
    </motion.div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const startGame = useGameStore(state => state.startGame);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashTap = async () => {
    // Initialize audio silently during this tap gesture
    await initAudioContextAsync();
    // Hide splash, show main screen
    setShowSplash(false);
  };

  const handleStart = () => {
    // Try fullscreen (non-blocking, fire and forget)
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    } catch (err) {
      // Fullscreen not available - continue anyway
    }
    
    // Navigate to game
    startGame();
    setLocation("/game");
  };

  return (
    <div data-testid="home-container">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onTap={handleSplashTap} />
        ) : (
          <MainScreen key="main" onStart={handleStart} />
        )}
      </AnimatePresence>
    </div>
  );
}
