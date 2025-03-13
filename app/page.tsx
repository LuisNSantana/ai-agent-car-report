"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { 
  ArrowRight, 
  Bot, 
  Brain,
  Car, 
  Check,
  Code, 
  FileText, 
  Gamepad, 
  Globe, 
  Heart, 
  LucideIcon, 
  Network,
  Server, 
  Sparkles, 
  Users 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TechnologyProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

interface VisionItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function LandingPage() {
  const technologies: TechnologyProps[] = [
    {
      name: "Next.js",
      description: "React framework for building modern web applications with server-side rendering",
      icon: <Code className="h-6 w-6 text-primary" />,
      features: [
        "Server components for optimal performance",
        "Seamless integration with our AI backend",
        "Responsive UI for all device types"
      ]
    },
    {
      name: "LangGraph",
      description: "Advanced framework for building stateful, multi-agent LLM applications with complex flows",
      icon: <Network className="h-6 w-6 text-primary" />,
      features: [
        "Multi-agent conversation orchestration",
        "Persistent memory for contextual awareness",
        "Dynamic workflow adaptation based on user needs"
      ]
    },
    {
      name: "Convex",
      description: "Real-time backend for seamless data synchronization and state management",
      icon: <Server className="h-6 w-6 text-primary" />,
      features: [
        "Real-time data synchronization across devices",
        "Secure storage for conversation history",
        "Scalable infrastructure for growing user base"
      ]
    },
    {
      name: "Clerk",
      description: "Complete user management and authentication solution for web applications",
      icon: <Users className="h-6 w-6 text-primary" />,
      features: [
        "Secure user authentication and management",
        "Personalized AI experiences for each user",
        "Privacy-focused data handling"
      ]
    },
  ];

  const visionItems: VisionItemProps[] = [
    {
      title: "Creating a Better World",
      description: "We believe technology should enhance human potential, not replace it. Zynk is designed to augment your capabilities and help you achieve more.",
      icon: <Globe className="h-6 w-6 text-primary" />,
    },
    {
      title: "Making Life Easier",
      description: "Our mission is to simplify complex tasks through intuitive AI assistance, saving you time and reducing cognitive load.",
      icon: <Heart className="h-6 w-6 text-primary" />,
    },
    {
      title: "For Everyone",
      description: "We're committed to creating accessible technology that serves people from all walks of life, regardless of technical expertise.",
      icon: <Users className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]"></div>
      </div>

      {/* Hero Section - Centered, Bold, Minimalist */}
      <div className="flex-1 space-y-32 pb-8 pt-16 md:pb-12 md:pt-24 lg:py-32">
        <div className="container mx-auto flex flex-col items-center gap-6 text-center">
          {/* Animated Brand Logo */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 to-primary/30 rounded-full blur-xl opacity-70 animate-pulse"></div>
            <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 shadow-lg">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          
          {/* Brand Name - Much Larger */}
          <h1 className={cn(
            "text-5xl sm:text-7xl md:text-8xl lg:text-9xl",
            "font-bold tracking-tight",
            "bg-gradient-to-r from-primary via-primary/90 to-primary",
            "bg-clip-text text-transparent",
            "drop-shadow-sm",
            "animate-shimmer"
          )}>
            ZYNK
          </h1>

          {/* Tagline - Smaller */}
          <p className={cn(
            "text-xl sm:text-2xl md:text-3xl",
            "font-medium tracking-tight",
            "bg-gradient-to-b from-foreground to-foreground/70",
            "bg-clip-text text-transparent",
            "max-w-[42rem]"
          )}>
            Your Intelligent Digital Assistant
          </p>

          {/* Slogan */}
          <div className="relative mt-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur opacity-70"></div>
            <p className="relative text-lg italic text-muted-foreground px-4 py-1 rounded-full bg-background/30 backdrop-blur-sm border border-primary/10">
              "Done by people, for the people"
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/20 rounded-2xl blur opacity-70"></div>
            <p className="relative max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10">
              Experience the future of AI assistance with Zynk. Analyze documents, explore car markets,
              and discuss gaming - all through natural conversation.
            </p>
          </div>

          <div className="space-x-4 mt-4">
            <SignedIn>
              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex items-center justify-center",
                  "rounded-xl px-8 py-4",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90",
                  "transition-all duration-200",
                  "font-medium text-lg",
                  "shadow-lg shadow-primary/20",
                  "hover:shadow-xl hover:shadow-primary/30",
                  "hover:scale-105",
                  "animate-shimmer-subtle"
                )}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className={cn(
                    "inline-flex items-center justify-center",
                    "rounded-xl px-8 py-4",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "transition-all duration-200",
                    "font-medium text-lg",
                    "shadow-lg shadow-primary/20",
                    "hover:shadow-xl hover:shadow-primary/30",
                    "hover:scale-105",
                    "animate-shimmer-subtle"
                  )}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Features Section - Horizontal Cards with Overlapping Elements */}
        <div className="bg-gradient-to-b from-background to-accent/10 py-24 w-full">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 md:mb-0 max-w-md text-center md:text-left">
                What <span className="text-primary">Zynk</span> Can Do For You
              </h2>
              <p className="text-muted-foreground max-w-md text-lg text-center md:text-left">
                Explore the powerful capabilities of Zynk and discover how it can transform your daily tasks
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {[
                {
                  title: "Document Analysis",
                  description: "Extract insights from documents with advanced AI analysis",
                  icon: <FileText className="h-8 w-8 text-white" />,
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  title: "Car Market Expert",
                  description: "Get detailed insights about car prices and market trends",
                  icon: <Car className="h-8 w-8 text-white" />,
                  color: "from-emerald-500 to-teal-600",
                },
                {
                  title: "Gaming Companion",
                  description: "Your go-to resource for gaming tips and discussions",
                  icon: <Gamepad className="h-8 w-8 text-white" />,
                  color: "from-violet-500 to-purple-600",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group relative h-full"
                >
                  {/* Top floating card with icon */}
                  <div className={cn(
                    "absolute -top-6 left-6 z-10",
                    "w-16 h-16 rounded-2xl",
                    "flex items-center justify-center",
                    "shadow-lg",
                    `bg-gradient-to-br ${feature.color}`
                  )}>
                    {feature.icon}
                  </div>
                  
                  {/* Main card */}
                  <div className={cn(
                    "relative h-full pt-14 pb-8 px-8 rounded-2xl",
                    "bg-background border border-primary/10",
                    "shadow-xl hover:shadow-2xl",
                    "transition-all duration-300",
                    "hover:-translate-y-2",
                    "overflow-hidden",
                    "z-0"
                  )}>
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-10"></div>
                    
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground text-lg">{feature.description}</p>
                    
                    <div className="mt-6 pt-6 border-t border-border/30">
                      <button className="text-primary font-medium flex items-center group-hover:text-primary/80 transition-colors">
                        Learn more <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Vision Section - Split Layout with Large Typography */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col lg:flex-row items-start gap-16">
            <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-24 self-start mx-auto lg:mx-0 text-center lg:text-left">
              <div className="inline-block rounded-full px-4 py-1 bg-primary/10 text-primary text-sm font-medium mb-2">
                Our Vision
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Creating a <span className="text-primary">better world</span> through technology
              </h2>
              <p className="text-muted-foreground text-lg">
                We're on a mission to make technology more human-centered, accessible, and beneficial for everyone.
              </p>
              <div className="h-1 w-20 bg-primary rounded-full mx-auto lg:mx-0"></div>
            </div>
            
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {visionItems.map((item, index) => (
                <div 
                  key={item.title}
                  className={cn(
                    "relative p-8 rounded-2xl",
                    "bg-background shadow-lg",
                    "border-l-4 border-primary",
                    "transition-all duration-300",
                    "hover:shadow-xl",
                    index % 2 === 0 ? "md:translate-y-8" : ""
                  )}
                >
                  <div className="flex flex-col gap-4">
                    <div className="p-3 rounded-full bg-primary/10 w-fit">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
              
              {/* Decorative element */}
              <div className="hidden md:block absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full -z-10 translate-x-1/2 translate-y-1/2"></div>
            </div>
          </div>
        </div>

        {/* Technology Stack Section - With LLM Focus */}
        <div className="bg-accent/5 py-24 overflow-hidden w-full">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block rounded-full px-4 py-1 bg-primary/10 text-primary text-sm font-medium mb-4">
                Our Technology
              </div>
              <h2 className="text-4xl font-bold mb-6">Powered By Modern AI Technology</h2>
              <p className="text-muted-foreground text-lg">
                We leverage cutting-edge LLM technologies and frameworks to deliver intelligent, responsive, and personalized experiences
              </p>
            </div>

            {/* LLM-focused intro section */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 mb-16">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/4 flex justify-center">
                  <div className="p-6 bg-background rounded-full shadow-lg">
                    <Brain className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-2xl font-bold mb-4">Our LLM Approach</h3>
                  <p className="text-lg mb-4">
                    At Zynk, we're pioneering the next generation of AI assistants by combining state-of-the-art language models with sophisticated orchestration frameworks. Our approach focuses on creating intuitive, contextually aware experiences that adapt to your needs.
                  </p>
                  <p className="text-lg">
                    We've built our system with privacy, reliability, and user empowerment at its core. Our technology stack is designed to provide seamless, intelligent assistance while ensuring your data remains secure and your experience remains consistent.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {technologies.map((tech, index) => (
                <div 
                  key={tech.name}
                  className={cn(
                    "relative overflow-hidden",
                    "rounded-2xl",
                    "transition-all duration-300",
                    "hover:-translate-y-2",
                    "group"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-60 z-0"></div>
                  <div className="relative z-10 p-8 backdrop-blur-sm bg-background/80 h-full border border-primary/10 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {tech.icon}
                      </div>
                      <h3 className="text-2xl font-bold">{tech.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-6">{tech.description}</p>
                    
                    {/* Tech features bullets */}
                    <ul className="space-y-3">
                      {tech.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Trust indicators */}
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-6">Trusted by developers and businesses worldwide</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-70">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-24 bg-foreground/10 rounded-md"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Future Plans Section - Dark Background with Glowing Elements */}
        <div className="bg-gradient-to-b from-background to-primary/5 py-24 relative overflow-hidden w-full">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block rounded-full px-4 py-1 bg-primary/10 text-primary text-sm font-medium mb-4">
                The Future
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Roadmap for Growth</h2>
              <p className="text-muted-foreground text-lg">
                We have ambitious plans to grow and evolve Zynk to serve more people in more ways
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  metric: "10,000+",
                  label: "Daily Active Users",
                  description: "Our goal is to help thousands of people every day with their tasks"
                },
                {
                  metric: "5+",
                  label: "New Capabilities",
                  description: "Continuously expanding what Zynk can do to serve more use cases"
                },
                {
                  metric: "99.9%",
                  label: "Service Reliability",
                  description: "Committed to providing a dependable service you can count on"
                },
                {
                  metric: "24/7",
                  label: "Global Availability",
                  description: "Available whenever and wherever you need assistance"
                }
              ].map((item, index) => (
                <div 
                  key={item.label}
                  className={cn(
                    "relative group",
                    "overflow-hidden"
                  )}
                >
                  {/* Glowing background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  
                  <div className={cn(
                    "relative p-8 rounded-2xl",
                    "bg-background/40 backdrop-blur-sm",
                    "border border-primary/10",
                    "transition-all duration-300",
                    "group-hover:border-primary/30",
                    "flex flex-col items-center text-center",
                    "h-full"
                  )}>
                    <div className="text-5xl font-bold text-primary mb-4">{item.metric}</div>
                    <h3 className="text-xl font-semibold mb-3">{item.label}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                    
                    {/* Decorative corner accent */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/5 rounded-tl-2xl -z-10"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Call to action */}
            <div className="mt-16 text-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className={cn(
                      "inline-flex items-center justify-center",
                      "rounded-xl px-8 py-4",
                      "bg-primary text-primary-foreground",
                      "hover:bg-primary/90",
                      "transition-all duration-200",
                      "font-medium text-lg",
                      "shadow-lg shadow-primary/20",
                      "hover:shadow-xl hover:shadow-primary/30",
                      "hover:scale-105"
                    )}
                  >
                    Join Us on This Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with brand reinforcement */}
      <div className="bg-background border-t border-border/30 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-bold text-2xl bg-gradient-to-r from-primary/90 via-primary to-primary/90 bg-clip-text text-transparent">
                  ZYNK
                </span>
              </div>
              <p className="text-muted-foreground">
                Done by people, for the people
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date().getFullYear()} Zynk AI. The future of intelligent assistance.
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Document Analysis</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Car Market Expert</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Gaming Companion</a></li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Our Vision</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}