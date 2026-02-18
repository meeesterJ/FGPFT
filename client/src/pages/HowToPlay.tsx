import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useIsLandscape } from "@/hooks/use-landscape";

function QuickStartDiagram() {
  return (
    <section className="flex flex-col items-center" data-testid="quick-start-diagram">
      <h2 className="text-3xl font-thin text-green-400 text-center mb-4">Quick Start</h2>
      <img 
        src="/quick-start-guide.jpg" 
        alt="Tilt forward for correct, tilt back to pass"
        className="w-full max-w-sm rounded-2xl"
      />
    </section>
  );
}

export default function HowToPlay() {
  useSwipeBack({ targetPath: "/" });
  const isLandscape = useIsLandscape();

  const sections = (
    <>
      <QuickStartDiagram />

      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
        <h2 className="text-xl font-thin text-pink-400">Getting Started</h2>
        <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <li>• One player holds the phone to their forehead and guesses while others give clues (verbal, acting, drawing, impersonation, accents, etc)</li>
          <li>• Clue givers may not say the word or part of the word</li>
          <li>• Tilt forward when you guess correctly or tilt backward to pass</li>
        </ul>
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

      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-green-500/30">
        <h2 className="text-xl font-thin text-green-400">Categories</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Customize your own lists!</p>
        <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <li>• Edit existing lists to add or remove words</li>
          <li>• Add brand new lists with your own themes</li>
          <li>• Add words one at a time or in bulk*</li>
        </ul>
        <p className="text-[0.6rem] text-muted-foreground/40 leading-tight mt-3">*There may be some helpful, possibly fake smart tools out there that could, possibly make a list you could, say, hypothetically copy and paste into, perhaps a category. 😉</p>
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

      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-purple-500/30">
        <h2 className="text-xl font-thin text-purple-400">Study Mode</h2>
        <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <li>• Great for language learning, flashcards, and vocabulary practice</li>
          <li>• Add answers in brackets after the prompt, e.g. "Hola [Hello]"</li>
          <li>• Tap the card to reveal the answer</li>
          <li>• Tilt is off by default — use the on-screen buttons instead</li>
          <li>• Set the timer to infinite for untimed study sessions</li>
          <li>• Mark a category as Study Mode when creating or editing a list</li>
        </ul>
      </section>
    </>
  );

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

      <ScrollArea className="flex-1 p-6 w-full">
        <div className={`pb-20 mx-auto ${isLandscape ? 'grid grid-cols-2 gap-6 max-w-4xl' : 'space-y-8 max-w-2xl'}`}>
          {sections}
        </div>
      </ScrollArea>
    </div>
  );
}
