import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { ArrowLeft } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Settings() {
  const store = useGameStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4 text-primary">Settings</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">
          
          {/* Game Duration */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin">Round Timer</h2>
              <span className="text-2xl font-mono text-primary">{store.roundDuration}s</span>
            </div>
            <Slider 
              value={[store.roundDuration]} 
              onValueChange={(v) => store.setRoundDuration(v[0])} 
              min={5} 
              max={60} 
              step={5}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">Adjust how long each guessing round lasts.</p>
          </section>

          {/* Rounds Count */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin">Total Rounds</h2>
              <span className="text-2xl font-mono text-secondary">{store.totalRounds}</span>
            </div>
            <Slider 
              value={[store.totalRounds]} 
              onValueChange={(v) => store.setTotalRounds(v[0])} 
              min={1} 
              max={10} 
              step={1}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">How many rounds to play before the game ends.</p>
          </section>

          {/* Show Buttons Toggle */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-xl font-thin">Show Buttons</h2>
                <p className="text-sm text-muted-foreground">Display Correct/Pass buttons during gameplay. Disable to use tilt gestures only.</p>
              </div>
              <Switch 
                checked={store.showButtons}
                onCheckedChange={store.setShowButtons}
                data-testid="switch-show-buttons"
              />
            </div>
          </section>

          {/* Haptic Feedback Toggle */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-xl font-thin">Haptic Feedback</h2>
                <p className="text-sm text-muted-foreground">Vibrate the phone when correct or pass is registered. Works on Android devices.</p>
              </div>
              <Switch 
                checked={store.hapticEnabled}
                onCheckedChange={store.setHapticEnabled}
                data-testid="switch-haptic"
              />
            </div>
          </section>

          {/* Sound Feedback Toggle */}
          <section className="space-y-4 bg-card p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-xl font-thin">Sound Feedback</h2>
                <p className="text-sm text-muted-foreground">Play a short beep when correct or pass is registered. Works on all devices.</p>
              </div>
              <Switch 
                checked={store.soundEnabled}
                onCheckedChange={store.setSoundEnabled}
                data-testid="switch-sound"
              />
            </div>
          </section>

        </div>
      </ScrollArea>
    </div>
  );
}
