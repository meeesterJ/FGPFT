import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function Privacy() {
  useSwipeBack({ targetPath: "/about" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col">
      <header className="p-4 flex items-center border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md sticky top-0 z-10">
        <Link href="/about">
          <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-purple-400" data-testid="text-title">Privacy Policy</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6 pb-20 text-sm text-muted-foreground leading-relaxed">
          
          <p className="text-xs text-muted-foreground" data-testid="text-last-updated">Last updated: January 2025</p>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-pink-400">Introduction</h2>
            <p>
              Family Guess Party Fun Time™ ("the App") is developed and operated by K Jasken and Associates, LLC ("we," "us," or "our"). This Privacy Policy explains how we handle information when you use our App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-cyan-400">Information We Collect</h2>
            <p>
              <strong>We do not collect personal information.</strong> The App is designed to be used locally on your device without requiring account creation, login, or data transmission to external servers.
            </p>
            <p>
              All game settings, custom word lists, and preferences are stored locally on your device using browser storage (localStorage). This data never leaves your device and is not accessible to us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-yellow-400">Device Permissions</h2>
            <p>The App may request access to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Device Orientation</strong> - Used for tilt-based gesture controls during gameplay</li>
              <li><strong>Vibration</strong> - Used for haptic feedback (optional, can be disabled in Settings)</li>
              <li><strong>Audio</strong> - Used for sound effects during gameplay (optional, can be disabled in Settings)</li>
            </ul>
            <p>These permissions are used solely for gameplay functionality and do not transmit any data externally.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-green-400">Third-Party Services</h2>
            <p>
              The App does not integrate with third-party analytics, advertising networks, or data collection services. We do not share any information with third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-purple-400">Children's Privacy</h2>
            <p>
              The App is designed for family entertainment and is suitable for all ages. We do not knowingly collect any personal information from children or any users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-pink-400">Data Security</h2>
            <p>
              Since all data is stored locally on your device, the security of your data depends on your device's security settings. We recommend using device passcodes and keeping your device software updated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-cyan-400">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date at the top of this page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-yellow-400">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at K Jasken and Associates, LLC.
            </p>
          </section>

          <p className="text-xs text-muted-foreground pt-4">
            © 2025 K Jasken and Associates, LLC. All rights reserved.
          </p>

        </div>
      </ScrollArea>
    </div>
  );
}
