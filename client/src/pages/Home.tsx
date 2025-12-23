import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { initAudioContext } from "@/lib/audio";
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

  const handleStart = async () => {
    // Mark animation as played
    if (shouldAnimate) {
      hasPlayedAnimation = true;
    }
    
    // Initialize audio on user gesture
    await initAudioContext().catch(() => {});
    
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
    <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-card overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
         <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center justify-center max-w-md w-full text-center gap-10">
        <motion.div
          variants={containerVariants}
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
        >
          <h1 className="text-7xl font-thin tracking-wide transform -rotate-2 leading-none">
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

        <div className="grid gap-3 w-full">
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
