import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function About() {
  useSwipeBack({ targetPath: "/settings" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-purple-400">About</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-8 pb-20">
          
          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-pink-500/30">
            <h2 className="text-xl font-thin text-pink-400">Family Guess Party Fun Time</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A fun party guessing game for the whole family! One player holds the phone to their forehead while others give verbal clues. Tilt forward when you guess correctly, or tilt backward to pass.
            </p>
          </section>

          <section className="space-y-4 bg-card/50 p-6 rounded-2xl border border-yellow-500/30">
            <h2 className="text-xl font-thin text-yellow-400">Family Guess Party Fun Time</h2>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-sm text-muted-foreground">© 2025 K Jasken and Associates LLC</p>
            <p className="text-sm text-muted-foreground">All rights reserved.</p>
            <p className="text-sm text-muted-foreground mt-4">This app is intended for fun, group play, and entertainment.</p>
            <div className="flex gap-4 mt-4">
              <Link href="/privacy">
                <span className="text-sm text-muted-foreground underline hover:text-purple-400 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-sm text-muted-foreground underline hover:text-purple-400 transition-colors cursor-pointer">
                  Terms of Use
                </span>
              </Link>
            </div>
          </section>

        </div>
      </ScrollArea>
    </div>
  );
}
