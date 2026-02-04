import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

function QuickStartDiagram() {
  return (
    <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 rounded-2xl border border-purple-500/40" data-testid="quick-start-diagram">
      <h2 className="text-xl font-thin text-purple-300 text-center mb-4">Quick Start</h2>
      
      <div className="flex items-end justify-center gap-6 mb-4">
        <div className="flex flex-col items-center flex-1">
          <svg className="w-28 h-36" viewBox="0 0 100 130" fill="none">
            <g className="text-green-400" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="18" r="12" fill="none" />
              <line x1="50" y1="30" x2="50" y2="70" />
              <line x1="50" y1="45" x2="30" y2="60" />
              <line x1="50" y1="45" x2="70" y2="35" />
              <line x1="50" y1="70" x2="35" y2="100" />
              <line x1="50" y1="70" x2="65" y2="100" />
              <rect x="62" y="8" width="24" height="14" rx="2" transform="rotate(15 74 15)" fill="none" />
            </g>
            <g transform="translate(50, 115)">
              <circle cx="0" cy="0" r="10" fill="rgba(34, 197, 94, 0.2)" stroke="none" />
              <path d="M-4 0 L-1 3 L5 -3" stroke="rgb(34, 197, 94)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <span className="text-green-400 font-semibold text-sm mt-1">Tilt Forward</span>
          <span className="text-green-300/70 text-xs">CORRECT</span>
        </div>

        <div className="w-px h-36 bg-purple-500/30" />

        <div className="flex flex-col items-center flex-1">
          <svg className="w-28 h-36" viewBox="0 0 100 130" fill="none">
            <g className="text-yellow-400" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="22" r="12" fill="none" />
              <line x1="50" y1="34" x2="50" y2="74" />
              <line x1="50" y1="49" x2="30" y2="39" />
              <line x1="50" y1="49" x2="70" y2="64" />
              <line x1="50" y1="74" x2="35" y2="104" />
              <line x1="50" y1="74" x2="65" y2="104" />
              <rect x="14" y="12" width="24" height="14" rx="2" transform="rotate(-15 26 19)" fill="none" />
            </g>
            <g transform="translate(50, 119)">
              <circle cx="0" cy="0" r="10" fill="rgba(234, 179, 8, 0.2)" stroke="none" />
              <path d="M-4 -3 L4 3 M4 -3 L-4 3" stroke="rgb(234, 179, 8)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </svg>
          <span className="text-yellow-400 font-semibold text-sm mt-1">Tilt Back</span>
          <span className="text-yellow-300/70 text-xs">PASS</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Hold phone to forehead in landscape mode
      </p>
    </section>
  );
}

export default function HowToPlay() {
  useSwipeBack({ targetPath: "/" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-cyan-500/30 bg-cyan-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-cyan-400" data-testid="text-title">How to Play</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">
          
          <QuickStartDiagram />

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
            <h2 className="text-xl font-thin text-pink-400">Getting Started</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One player holds the phone to their forehead and guesses while others give clues (verbal, acting, drawing, impersonation, accents, etc).
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clue givers may not say the word or part of the word.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tilt forward when you guess correctly or tilt backward to pass.
            </p>
          </section>

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-cyan-500/30">
            <h2 className="text-xl font-thin text-cyan-400">Step by Step</h2>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>1. Choose categories, time per round, and number of rounds in Settings, and start the game</li>
              <li>2. Hold your phone to your forehead in landscape mode</li>
              <li>3. Your friends give you clues without saying the word</li>
              <li>4. Tilt forward for correct, backward to pass</li>
              <li>5. Score as many points as you can before time runs out!</li>
            </ul>
          </section>

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
            <h2 className="text-xl font-thin text-yellow-400">Tips</h2>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>• Don't say the word or any part of it</li>
              <li>• Pass quickly if you're stuck to save time</li>
              <li>• Take turns being the guesser</li>
              <li>• Split into two teams and compete!</li>
              <li>• Give creative clues - act it out, describe it, use rhymes!</li>
              <li>• Use accents or impersonation or act out clues</li>
              <li>• House rules are highly encouraged!</li>
              <li>• Edit lists or create your own custom lists</li>
            </ul>
          </section>

        </div>
      </ScrollArea>
    </div>
  );
}
