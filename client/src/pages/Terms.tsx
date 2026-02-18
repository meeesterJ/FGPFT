import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSwipeBack } from "@/hooks/use-swipe-back";

export default function Terms() {
  useSwipeBack({ targetPath: "/about" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card flex flex-col safe-area-top">
      <header className="p-4 flex items-center border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md sticky top-0 z-10 safe-area-x">
        <Link href="/about">
          <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-thin ml-4 text-purple-400" data-testid="text-title">Terms of Use</h1>
      </header>

      <ScrollArea className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6 pb-20 text-sm text-muted-foreground leading-relaxed">
          
          <p className="text-xs text-muted-foreground" data-testid="text-last-updated">Last updated: February 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-pink-400">Agreement to Terms</h2>
            <p>
              By accessing or using Family Guess Party Fun Time™ ("the App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-cyan-400">License to Use</h2>
            <p>
              K Jasken and Associates, LLC grants you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial entertainment purposes.
            </p>
            <p>You may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Copy, modify, or distribute the App or its content</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Use the App for any commercial purpose without authorization</li>
              <li>Remove any copyright or proprietary notices</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-yellow-400">User Content</h2>
            <p>
              The App allows you to create custom word lists. You are solely responsible for any content you create. You agree not to create content that is offensive, harmful, or violates any laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-green-400">Intellectual Property</h2>
            <p>
              Family Guess Party Fun Time™ and all associated trademarks, logos, and content are the property of K Jasken and Associates, LLC. All rights reserved.
            </p>
            <p>
              The built-in word lists and game mechanics are protected by copyright. Unauthorized reproduction or distribution is prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-purple-400">Disclaimer of Warranties</h2>
            <p>
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-pink-400">Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, K JASKEN AND ASSOCIATES, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-cyan-400">Intended Use</h2>
            <p>
              This App is intended for fun, group play, and entertainment purposes only. Please play responsibly and be mindful of your surroundings when using device motion features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-yellow-400">Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Use at any time. Continued use of the App after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-green-400">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-thin text-purple-400">Contact Us</h2>
            <p>
              If you have questions about these Terms of Use, please contact us at K Jasken and Associates, LLC: <a href="mailto:KJaskenAssoc@pm.me" className="text-purple-400 underline hover:text-purple-300">KJaskenAssoc@pm.me</a>
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
