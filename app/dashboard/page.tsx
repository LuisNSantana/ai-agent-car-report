"use client";

import { BotIcon, Zap, Wrench, MessageSquareText, BarChart3, Clock, FileText, Car, Sparkles, User, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// Import card components directly from the components directory
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../../components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from 'react';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Fetch user's chats
  const chats = useQuery(api.chats.listChats);
  
  // Fetch token usage data with user ID when available
  const tokenUsage = useQuery(
    api.tokenUsage.getTotalTokenUsage,
    isLoaded && user ? { userId: user.id } : "skip"
  );

  // Log token usage data for debugging
  React.useEffect(() => {
    if (tokenUsage) {
      console.log("Token usage data:", tokenUsage);
    } else if (tokenUsage === undefined) {
      console.log("Token usage data is loading...");
    } else {
      console.log("No token usage data available");
    }
  }, [tokenUsage]);

  // Get the last 3 chats
  const recentChats = chats?.slice(0, 3) || [];
  
  // Calculate total chats
  const totalChats = chats?.length || 0;
  
  // Sample conversation snippets that match the sidebar format
  const sampleConversations = [
    { role: "assistant", content: "Hello! I'm here to help you with any questions." },
    { role: "assistant", content: "Voy a consultar las métricas del informe." },
    { role: "assistant", content: "It seems there is a performance issue with the database." },
    { role: "user", content: "Si genera el reporte pdf" },
    { role: "assistant", content: "Sí, voy a intentar generar el reporte ahora." },
    { role: "assistant", content: "Voy a analizar los datos del vehículo." }
  ];
  
  // Format chat time
  const formatChatTime = (timestamp: number) => {
    if (!timestamp) return "Unknown time";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Handle chat click
  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chat/${chatId}`);
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-secondary/5 to-background opacity-50" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 -z-5 h-full w-full bg-[linear-gradient(to_right,#2a2a2a1a_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2a1a_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
      <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-accent rounded-full animate-pulse delay-300" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-secondary rounded-full animate-pulse delay-700" />

      <div className="relative max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Welcome to Zynk
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI assistant dashboard with powerful tools and insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Stats Cards */}
          <Card className="col-span-2 bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Activity Overview</span>
              </CardTitle>
              <CardDescription>Your recent usage and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <MessageSquareText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
                    <h3 className="text-2xl font-bold">{totalChats}</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                    <Clock className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Time</p>
                    <h3 className="text-2xl font-bold">3.5 hrs</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                    <FileText className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documents Analyzed</p>
                    <h3 className="text-2xl font-bold">12</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <Car className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Car Reports</p>
                    <h3 className="text-2xl font-bold">5</h3>
                  </div>
                </div>
              </div>
              
              {/* Activity Chart Placeholder */}
              <div className="mt-6 h-[160px] rounded-lg bg-background/50 border border-border/50 flex items-center justify-center">
                <div className="text-center p-4">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Activity chart will appear here as you use Zynk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Your Profile</span>
              </CardTitle>
              <CardDescription>Account information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center p-4 space-y-4">
                {isLoaded && user ? (
                  <>
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary overflow-hidden">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName || "User"} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user.fullName || user.username || "User"}</h3>
                      <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
                      <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Beta Plan
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <div className="h-6 w-24 bg-primary/10 rounded animate-pulse"></div>
                  </div>
                )}
                
                <div className="w-full pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Beta Usage</span>
                    <span className="font-medium flex items-center">
                      <Infinity className="h-4 w-4 mr-1" /> Unlimited
                    </span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary via-accent to-primary w-full rounded-full animate-pulse" />
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Manage Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Token Usage</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/admin" className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                <span>Admin</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 h-4 w-4"
                >
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </Link>
              <Link href="/dashboard/usage" className="flex items-center text-sm text-purple-500 hover:text-purple-600 transition-colors">
                <span>Detailed Analytics</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>

          {tokenUsage === undefined ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              {tokenUsage && tokenUsage.totalTokens > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Input Tokens</h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{tokenUsage.totalInputTokens.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{tokenUsage.totalInputTokens > 0 ? `Across ${tokenUsage.totalChats} chats` : 'No tokens used yet'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Output Tokens</h3>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{tokenUsage.totalOutputTokens.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{tokenUsage.totalOutputTokens > 0 ? `Across ${tokenUsage.totalChats} chats` : 'No tokens used yet'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tokens</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{tokenUsage.totalTokens.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{tokenUsage.totalTokens > 0 ? `Across ${tokenUsage.totalChats} chats` : 'No tokens used yet'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Sparkles className="h-8 w-8 text-purple-400 mb-2 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 mb-1">No token usage data available yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Start a new chat to begin tracking token usage</p>
                  <Link href="/chat" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    <Sparkles className="h-4 w-4 mr-2" />
                    New Chat
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Zynk Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: MessageSquareText,
                label: "Real-time Chat",
                description: "Chat with an AI that understands context",
                color: "text-blue-400",
                bgColor: "bg-blue-400/10",
                borderColor: "border-blue-400/20"
              },
              {
                icon: Zap,
                label: "Smart Assistant",
                description: "Get instant answers and insights",
                color: "text-amber-400",
                bgColor: "bg-amber-400/10",
                borderColor: "border-amber-400/20"
              },
              {
                icon: Car,
                label: "Car Reports",
                description: "Find the best deals in your area",
                color: "text-green-400",
                bgColor: "bg-green-400/10",
                borderColor: "border-green-400/20"
              },
              {
                icon: Wrench,
                label: "Powerful Tools",
                description: "Access a suite of productivity tools",
                color: "text-purple-400",
                bgColor: "bg-purple-400/10",
                borderColor: "border-purple-400/20"
              }
            ].map((feature) => (
              <div
                key={feature.label}
                className={cn(
                  "relative group rounded-lg p-4 transition-all duration-300 hover:scale-105",
                  feature.bgColor,
                  "border",
                  feature.borderColor
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <feature.icon className={cn("w-5 h-5", feature.color)} />
                    <span className={cn("text-sm font-medium", feature.color)}>
                      {feature.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Chats Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentChats.length > 0 ? (
              recentChats.map((chat) => {
                // Use a consistent index based on chat ID to get a stable conversation snippet
                const chatIdSum = chat._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const sampleIndex = chatIdSum % sampleConversations.length;
                const sampleMessage = sampleConversations[sampleIndex];
                
                return (
                  <div
                    key={chat._id}
                    className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors cursor-pointer"
                    onClick={() => handleChatClick(chat._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium truncate flex-1">
                        <span className="text-muted-foreground">
                          {sampleMessage.role === "user" ? "You: " : "Zynk: "}
                        </span>
                        {sampleMessage.content}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Continue this conversation...
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatChatTime(chat.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 p-8 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 text-center">
                <MessageSquareText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No conversations yet. Start a new chat to begin!</p>
                <Button 
                  className="mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => router.push('/dashboard/chat')}
                >
                  New Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}