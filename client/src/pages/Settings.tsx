import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import { Button } from "@/components/ui/button";
import { useGameStore, TEAM_THEME_COLORS, MAX_TEAM_NAME_LENGTH } from "@/lib/store";
import { ArrowLeft, Share, ChevronDown, Gamepad2, BookOpen } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useIsLandscape } from "@/hooks/use-landscape";

function TeamNameInput({ index }: { index: number }) {
  const teamName = useGameStore(s => s.teamNames[index]);
  const setTeamName = useGameStore(s => s.setTeamName);
  const color = TEAM_THEME_COLORS[index % TEAM_THEME_COLORS.length];
  const defaultName = `Team ${index + 1}`;
  const [localValue, setLocalValue] = useState(teamName || defaultName);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(teamName || defaultName);
    }
  }, [teamName, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, MAX_TEAM_NAME_LENGTH);
    setLocalValue(val);
    setTeamName(index, val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue.trim() === '') {
      setLocalValue(defaultName);
      setTeamName(index, defaultName);
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

const STUDY_TIMER_STEPS = [60, 120, 300, 600, 0];
const STUDY_TIMER_LABELS = ['1 min', '2 min', '5 min', '10 min', '\u221E'];

function studyTimerToSlider(duration: number): number {
  const idx = STUDY_TIMER_STEPS.indexOf(duration);
  return idx >= 0 ? idx : 0;
}

function sliderToStudyTimer(val: number): number {
  return STUDY_TIMER_STEPS[val] ?? 60;
}

export default function Settings() {
  useSwipeBack({ targetPath: "/" });
  const {
    studyMode, roundDuration, totalRounds, showButtons, tiltEnabled,
    hapticEnabled, soundEnabled, soundVolume, numberOfTeams,
    setStudyMode, setRoundDuration, setTotalRounds, setShowButtons,
    setTiltEnabled, setHapticEnabled, setSoundEnabled, setSoundVolume,
    setNumberOfTeams,
  } = useGameStore(useShallow(s => ({
    studyMode: s.studyMode,
    roundDuration: s.roundDuration,
    totalRounds: s.totalRounds,
    showButtons: s.showButtons,
    tiltEnabled: s.tiltEnabled,
    hapticEnabled: s.hapticEnabled,
    soundEnabled: s.soundEnabled,
    soundVolume: s.soundVolume,
    numberOfTeams: s.numberOfTeams,
    setStudyMode: s.setStudyMode,
    setRoundDuration: s.setRoundDuration,
    setTotalRounds: s.setTotalRounds,
    setShowButtons: s.setShowButtons,
    setTiltEnabled: s.setTiltEnabled,
    setHapticEnabled: s.setHapticEnabled,
    setSoundEnabled: s.setSoundEnabled,
    setSoundVolume: s.setSoundVolume,
    setNumberOfTeams: s.setNumberOfTeams,
  })));
  const isLandscape = useIsLandscape();
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

  const handleModeToggle = (study: boolean) => {
    setStudyMode(study);
    if (study) {
      setNumberOfTeams(1);
      setTotalRounds(1);
      setSoundEnabled(false);
      setTiltEnabled(false);
      if (!STUDY_TIMER_STEPS.includes(roundDuration)) {
        setRoundDuration(300);
      }
    } else {
      setTiltEnabled(true);
      if (STUDY_TIMER_STEPS.includes(roundDuration) && roundDuration > 60) {
        setRoundDuration(30);
      } else if (roundDuration === 0) {
        setRoundDuration(30);
      }
    }
  };

  const studyTimerLabel = studyMode
    ? STUDY_TIMER_LABELS[studyTimerToSlider(roundDuration)] ?? '5 min'
    : null;

  const settingsSections = (
    <>
      {/* Number of Teams */}
      <section className={`space-y-4 bg-card/50 p-6 rounded-2xl border border-cyan-500/30 ${studyMode ? 'opacity-50' : ''}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-thin text-cyan-400">Number of Teams</h2>
          <span className="text-2xl font-mono text-cyan-300">{studyMode ? 1 : numberOfTeams}</span>
        </div>
        {!studyMode && (
          <>
            <Slider 
              value={[numberOfTeams]} 
              onValueChange={(v) => setNumberOfTeams(v[0])} 
              min={1} 
              max={5} 
              step={1}
              className="py-2"
              data-testid="slider-number-of-teams"
            />

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
                {Array.from({ length: numberOfTeams }, (_, i) => (
                  <TeamNameInput key={i} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
      
      {/* Round Timer */}
      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-thin text-pink-400">Round Timer</h2>
          <span className="text-2xl font-mono text-pink-300">
            {studyMode ? (
              roundDuration === 0 ? <span className="text-3xl leading-none font-black">∞</span> : studyTimerLabel
            ) : `${roundDuration}s`}
          </span>
        </div>
        {studyMode ? (
          <Slider 
            value={[studyTimerToSlider(roundDuration)]} 
            onValueChange={(v) => setRoundDuration(sliderToStudyTimer(v[0]))} 
            min={0} 
            max={4} 
            step={1}
            className="py-4"
            data-testid="slider-round-timer-study"
          />
        ) : (
          <Slider 
            value={[roundDuration]} 
            onValueChange={(v) => setRoundDuration(v[0])} 
            min={5} 
            max={60} 
            step={5}
            className="py-4"
            data-testid="slider-round-timer"
          />
        )}
      </section>

      {/* Rounds Count */}
      <section className={`space-y-4 bg-card/50 p-6 rounded-2xl border border-green-500/30 ${studyMode ? 'opacity-50' : ''}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-thin text-green-400">Total Rounds</h2>
          <span className="text-2xl font-mono text-green-300">{studyMode ? 1 : totalRounds}</span>
        </div>
        {!studyMode && (
          <Slider 
            value={[totalRounds]} 
            onValueChange={(v) => setTotalRounds(v[0])} 
            min={1} 
            max={5} 
            step={1}
            className="py-4"
            data-testid="slider-total-rounds"
          />
        )}
      </section>

      {/* Sounds Toggle */}
      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-thin text-yellow-400">Sounds</h2>
          <Switch 
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            data-testid="switch-sound"
          />
        </div>
        {soundEnabled && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="text-sm font-mono text-yellow-300">{soundVolume}%</span>
            </div>
            <Slider 
              value={[soundVolume]} 
              onValueChange={(v) => setSoundVolume(v[0])} 
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
            <h2 className="text-xl font-thin text-green-400">Vibration</h2>
            <Switch 
              checked={hapticEnabled}
              onCheckedChange={setHapticEnabled}
              data-testid="switch-haptic"
            />
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-purple-500/30">
        <h2 className="text-xl font-thin text-purple-400">Controls</h2>
        <div className="flex justify-between items-center">
          <span className="text-base text-purple-300">Tilt Gestures</span>
          <Switch 
            checked={tiltEnabled}
            onCheckedChange={setTiltEnabled}
            data-testid="switch-tilt-enabled"
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base text-purple-300">Show Buttons</span>
            {!tiltEnabled && (
              <span className="text-xs text-purple-400/70 italic">Required</span>
            )}
          </div>
          <Switch 
            checked={showButtons}
            onCheckedChange={setShowButtons}
            disabled={!tiltEnabled}
            data-testid="switch-show-buttons"
          />
        </div>
      </section>

      {/* Study / Game Mode Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-purple-500/30 h-10" data-testid="toggle-study-game-mode">
        <button
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            !studyMode
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-300 border-r border-purple-500/30'
              : 'bg-card/30 text-muted-foreground hover:text-pink-300 border-r border-purple-500/30'
          }`}
          onClick={() => handleModeToggle(false)}
          data-testid="button-game-mode"
        >
          <Gamepad2 className="w-4 h-4" />
          Game Mode
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            studyMode
              ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-cyan-300'
              : 'bg-card/30 text-muted-foreground hover:text-cyan-300'
          }`}
          onClick={() => handleModeToggle(true)}
          data-testid="button-study-mode"
        >
          <BookOpen className="w-4 h-4" />
          Study Mode
        </button>
      </div>

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
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col safe-area-x">
      <header className="p-4 flex items-center border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md sticky top-0 z-10 safe-area-top">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-purple-400">Settings</h1>
      </header>

      <ScrollArea className="flex-1 p-6 w-full">
        <div className={`pb-20 ${isLandscape ? 'space-y-8 max-w-3xl ml-8' : 'space-y-8 max-w-2xl mx-auto'}`}>
          {settingsSections}
        </div>
      </ScrollArea>
    </div>
  );
}
