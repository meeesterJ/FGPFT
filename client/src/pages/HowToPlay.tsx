import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

function QuickStartDiagram() {
  return (
    <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 rounded-2xl border border-purple-500/40" data-testid="quick-start-diagram">
      <h2 className="text-xl font-thin text-purple-300 text-center mb-6">Quick Start</h2>
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="relative w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg border-2 border-gray-600 shadow-lg transform -rotate-[30deg]">
            <div className="absolute inset-1 bg-gradient-to-b from-green-500/30 to-green-600/30 rounded-md flex items-center justify-center">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 8h16l-8-8z" />
              </svg>
            </div>
          </div>
          <span className="text-green-400 font-medium text-sm mt-2">Tilt Forward</span>
          <span className="text-green-300/80 text-xs">CORRECT</span>
        </div>

        <div className="w-px h-20 bg-purple-500/30" />

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="relative w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg border-2 border-gray-600 shadow-lg transform rotate-[30deg]">
            <div className="absolute inset-1 bg-gradient-to-b from-yellow-500/30 to-yellow-600/30 rounded-md flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20l8-8H4l8 8z" />
              </svg>
            </div>
          </div>
          <span className="text-yellow-400 font-medium text-sm mt-2">Tilt Back</span>
          <span className="text-yellow-300/80 text-xs">PASS</span>
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
