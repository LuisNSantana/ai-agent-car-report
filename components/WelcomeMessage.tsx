import { Bot, Coffee, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export default function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full mt-10">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -z-10 -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl opacity-70"></div>
        
        <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl px-8 py-6 max-w-lg w-full shadow-xl">
          {/* Header with icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className={cn(
              "text-2xl font-bold",
              "bg-gradient-to-r from-primary via-primary/90 to-primary",
              "bg-clip-text text-transparent"
            )}>
              Well, Hello There! 👋
            </h2>
            <p className="text-muted-foreground mt-2">
              Ready to chat with an AI that doesn't judge your typos? (We all make them!)
            </p>
          </div>
          
          {/* Features section */}
          <div className="space-y-5">
            <h3 className="text-lg font-medium text-foreground">I'm basically a digital Swiss Army knife that can:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Document Whisperer",
                  description: "I'll read those boring docs so you don't have to"
                },
                {
                  title: "Car Deal Detective",
                  description: "Find sweet rides without the salesperson talk"
                },
                {
                  title: "Gaming Buddy",
                  description: "Like having a friend who actually knows the cheat codes"
                },
                {
                  title: "YouTube Decoder",
                  description: "Get the good stuff without the 'like and subscribe'"
                },
                {
                  title: "Data Magician",
                  description: "Turn confusing numbers into actual insights"
                },
                {
                  title: "Telegram Messenger",
                  description: "Send messages while you sip your coffee"
                },
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:bg-background/80 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-medium">0{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Car market report highlight */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10 mt-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Car Reports That Won't Put You to Sleep</h4>
                  <p className="text-sm text-muted-foreground">Get the scoop on car deals in zipcode 32789 without reading 50 pages of fine print</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-center text-sm mt-6">
            Don't worry, I promise not to start the robot uprising... yet. 😉
          </p>
        </div>
      </div>
    </div>
  );
}
