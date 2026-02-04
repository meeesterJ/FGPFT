import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function HowToPlay() {
  useSwipeBack({ targetPath: "/" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-cyan-500/30 bg-cyan-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-cyan-400">How to Play</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">
          
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
            <h2 className="text-xl font-thin text-pink-400">Getting Started</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One player holds the phone to their forehead while others give verbal clues. Tilt forward when you guess correctly, or tilt backward to pass.
            </p>
          </section>

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-cyan-500/30">
            <h2 className="text-xl font-thin text-cyan-400">Step by Step</h2>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>1. Choose a category and start the game</li>
              <li>2. Hold your phone to your forehead in landscape mode</li>
              <li>3. Your friends give you clues without saying the word</li>
              <li>4. Tilt forward for correct, backward to pass</li>
              <li>5. Score as many points as you can before time runs out!</li>
            </ul>
          </section>

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
            <h2 className="text-xl font-thin text-yellow-400">Tips</h2>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>• Give creative clues - act it out, describe it, use rhymes!</li>
              <li>• Don't say the word or any part of it</li>
              <li>• Pass quickly if you're stuck to save time</li>
              <li>• Take turns being the guesser</li>
            </ul>
          </section>

        </div>
      </ScrollArea>
    </div>
  );
}
