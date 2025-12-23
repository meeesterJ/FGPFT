import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
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

let hasPlayedAnimation = false;

export default function Home() {
  const [, setLocation] = useLocation();
  const startGame = useGameStore(state => state.startGame);
  const [showButtons, setShowButtons] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Detect desktop using pointer precision (fine = mouse, coarse = touch)
  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined') return false;
    // Use pointer media query - "fine" means mouse/trackpad, "coarse" means touch
    return window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(hover: none)').matches;
  }, []);

  const shouldAnimate = !hasPlayedAnimation && !prefersReducedMotion && !isDesktop;

  // Handle splash screen tap - unlock audio silently and reveal buttons
  const handleSplashTap = async () => {
    // Initialize audio silently during this tap gesture
    await initAudioContextAsync();
    
    // Reveal the buttons
    setShowButtons(true);
    
    // Mark animation as played (for future visits)
    hasPlayedAnimation = true;
  };

  const handleStart = () => {
    // Audio is already unlocked from splash tap
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
    <div 
      className="h-[100dvh] flex flex-col items-center p-4 bg-gradient-to-b from-background to-card relative"
      style={{
        justifyContent: showButtons ? 'flex-start' : 'center',
        paddingTop: showButtons ? '2rem' : '1rem',
        overflowY: showButtons ? 'auto' : 'hidden',
      }}
      onClick={!showButtons ? handleSplashTap : undefined}
      data-testid="home-container"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
         <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div 
        className="z-10 flex flex-col items-center max-w-md w-full text-center"
        style={{ gap: showButtons ? '1.5rem' : '2.5rem' }}
      >
        <motion.div
          variants={containerVariants}
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
        >
          <h1 
            className="font-thin tracking-wide transform -rotate-2 leading-none"
            style={{ fontSize: showButtons ? '3rem' : '4.5rem' }}
          >
            {titleWords.map((word) => (
              <motion.span
                key={word.text}
                className={`block ${word.color}`}
                variants={shouldAnimate ? wordVariants : undefined}
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

        <AnimatePresence mode="wait">
          {!showButtons ? (
            <motion.p
              key="tap-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl text-muted-foreground font-light animate-pulse"
              data-testid="text-tap-prompt"
            >
              Tap anywhere to start
            </motion.p>
          ) : (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-3 w-full"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
