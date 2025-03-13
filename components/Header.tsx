"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-2",
            "text-lg font-semibold",
            "bg-gradient-to-r from-foreground to-foreground/80",
            "hover:from-primary hover:to-primary/80",
            "bg-clip-text text-transparent",
            "transition-all duration-200"
          )}
        >
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span>Zynk</span>
          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            beta
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <SignedIn>
            <div className="flex items-center justify-center">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-[32px] w-[32px] flex items-center justify-center"
                  }
                }}
              />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={cn(
                "inline-flex items-center justify-center",
                "rounded-xl px-4 py-2 text-sm font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "transition-colors duration-200"
              )}>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
