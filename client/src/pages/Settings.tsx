import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore, TEAM_THEME_COLORS, MAX_TEAM_NAME_LENGTH } from "@/lib/store";
import { ArrowLeft, Share, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

function TeamNameInput({ index }: { index: number }) {
  const store = useGameStore();
  const color = TEAM_THEME_COLORS[index % TEAM_THEME_COLORS.length];
  const defaultName = `Team ${index + 1}`;
  const [localValue, setLocalValue] = useState(store.teamNames[index] || defaultName);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(store.teamNames[index] || defaultName);
    }
  }, [store.teamNames[index], isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, MAX_TEAM_NAME_LENGTH);
    setLocalValue(val);
    store.setTeamName(index, val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue.trim() === '') {
      setLocalValue(defaultName);
      store.setTeamName(index, defaultName);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${color.bg} border ${color.border}`}>
      <div className={`w-3 h-3 rounded-full bg-current ${color.text} flex-shrink-0`} />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        maxLength={MAX_TEAM_NAME_LENGTH}
        placeholder={defaultName}
        className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${color.text} placeholder:text-muted-foreground/50`}
        data-testid={`input-team-name-${index + 1}`}
      />
      <span className="text-xs text-muted-foreground">
        {localValue.length}/{MAX_TEAM_NAME_LENGTH}
      </span>
    </div>
  );
}

export default function Settings() {
  useSwipeBack({ targetPath: "/" });
  const store = useGameStore();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [teamsExpanded, setTeamsExpanded] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIPadOS = navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1;
    setIsIOS(isIOSDevice || isIPadOS);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-purple-400">Settings</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">

          {/* Number of Teams */}
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-cyan-500/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin text-cyan-400">Number of Teams</h2>
              <span className="text-2xl font-mono text-cyan-300">{store.numberOfTeams}</span>
            </div>
            <Slider 
              value={[store.numberOfTeams]} 
              onValueChange={(v) => store.setNumberOfTeams(v[0])} 
              min={1} 
              max={5} 
              step={1}
              className="py-2"
              data-testid="slider-number-of-teams"
            />

            {/* Customize Teams expandable */}
            <button
              onClick={() => setTeamsExpanded(!teamsExpanded)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors w-full pt-1"
              data-testid="button-customize-teams"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${teamsExpanded ? 'rotate-180' : ''}`} />
              <span>Customize Teams</span>
            </button>

            {teamsExpanded && (
              <div className="space-y-3 pt-2">
                {Array.from({ length: store.numberOfTeams }, (_, i) => (
                  <TeamNameInput key={i} index={i} />
                ))}
              </div>
            )}
          </section>
          
          {/* Game Duration */}
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin text-pink-400">Round Timer</h2>
              <span className="text-2xl font-mono text-pink-300">{store.roundDuration}s</span>
            </div>
            <Slider 
              value={[store.roundDuration]} 
              onValueChange={(v) => store.setRoundDuration(v[0])} 
              min={5} 
              max={60} 
              step={5}
              className="py-4"
            />
          </section>

          {/* Rounds Count */}
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-green-500/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin text-green-400">Total Rounds</h2>
              <span className="text-2xl font-mono text-green-300">{store.totalRounds}</span>
            </div>
            <Slider 
              value={[store.totalRounds]} 
              onValueChange={(v) => store.setTotalRounds(v[0])} 
              min={1} 
              max={5} 
              step={1}
              className="py-4"
            />
          </section>

          {/* Sounds Toggle */}
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin text-yellow-400">Sounds</h2>
              <Switch 
                checked={store.soundEnabled}
                onCheckedChange={store.setSoundEnabled}
                data-testid="switch-sound"
              />
            </div>
            {store.soundEnabled && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <span className="text-sm font-mono text-yellow-300">{store.soundVolume}%</span>
                </div>
                <Slider 
                  value={[store.soundVolume]} 
                  onValueChange={(v) => store.setSoundVolume(v[0])} 
                  min={0} 
                  max={100} 
                  step={5}
                  className="py-2"
                  data-testid="slider-volume"
                />
              </div>
            )}
          </section>

          {/* Haptic Feedback Toggle - only show when installed as PWA */}
          {isStandalone && (
            <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-green-500/30">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-thin text-green-400">Haptic Feedback</h2>
                <Switch 
                  checked={store.hapticEnabled}
                  onCheckedChange={store.setHapticEnabled}
                  data-testid="switch-haptic"
                />
              </div>
            </section>
          )}

          {/* Show Buttons Toggle */}
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-purple-500/30">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-thin text-purple-400">Show Buttons</h2>
              <Switch 
                checked={store.showButtons}
                onCheckedChange={store.setShowButtons}
                data-testid="switch-show-buttons"
              />
            </div>
          </section>

          {/* iOS hint to add to home screen - show only in browser */}
          {isIOS && !isStandalone && (
            <section className="bg-card/50 p-4 rounded-2xl border border-border flex items-center gap-3">
              <Share className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">For the best fullscreen experience, tap the share button and "Add to Home Screen"</span>
            </section>
          )}

          {/* About link */}
          <div className="flex justify-center pt-4">
            <Link href="/about">
              <span className="text-sm text-muted-foreground underline hover:text-purple-400 transition-colors cursor-pointer">
                About
              </span>
            </Link>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
