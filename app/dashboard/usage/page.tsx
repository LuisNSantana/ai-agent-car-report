"use client";

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "@tremor/react";
import { ChevronLeft, BarChart3, LineChart as LineChartIcon, PieChart, Sparkles } from "lucide-react";
import React from "react";

// Date utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getDateRange = (days: number) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1); // +1 to include today
  
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

export default function TokenUsagePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold">Token Usage Analytics</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Track your token consumption and usage patterns over time
        </p>
      </div>
      
      <TokenUsageContent />
    </div>
  );
}

function TokenUsageContent() {
  // Default to 30 days
  const { startDate, endDate } = getDateRange(30);
  
  // Get total token usage
  const tokenUsage = useQuery(api.tokenUsage.getTotalTokenUsage, {
    userId: undefined // This will use the current user's ID from the auth context
  });
  
  // Get token usage by date range
  const tokenUsageByDate = useQuery(api.tokenUsage.getTokenUsageByDateRange, {
    startDate,
    endDate,
  });

  // Add debugging logs
  React.useEffect(() => {
    console.log("Token usage data:", tokenUsage);
    console.log("Token usage by date:", tokenUsageByDate);
  }, [tokenUsage, tokenUsageByDate]);
  
  // Handle loading and error states
  if (!tokenUsage || !tokenUsageByDate) {
    return <TokenUsageLoading />;
  }
  
  // Format data for charts
  const dailyData = tokenUsageByDate.map(day => ({
    date: formatDate(day.date),
    "Input Tokens": day.input,
    "Output Tokens": day.output,
    "Total Tokens": day.total,
  }));
  
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-600 dark:text-purple-400 flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Total Tokens
            </CardTitle>
            <CardDescription>Across {(tokenUsage.totalChats || 0)} chats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(tokenUsage.totalTokens || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-600 dark:text-indigo-400 flex items-center text-lg">
              <LineChartIcon className="h-5 w-5 mr-2" />
              Input Tokens
            </CardTitle>
            <CardDescription>{Math.round(((tokenUsage.totalInputTokens || 0) / ((tokenUsage.totalTokens || 1))) * 100)}% of total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(tokenUsage.totalInputTokens || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center text-lg">
              <PieChart className="h-5 w-5 mr-2" />
              Output Tokens
            </CardTitle>
            <CardDescription>{Math.round(((tokenUsage.totalOutputTokens || 0) / ((tokenUsage.totalTokens || 1))) * 100)}% of total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(tokenUsage.totalOutputTokens || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="daily" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Usage Over Time</h2>
          <TabsList>
            <TabsTrigger value="daily">Daily Usage</TabsTrigger>
            <TabsTrigger value="distribution">Token Distribution</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="daily" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6">
              {dailyData.length > 0 ? (
                <LineChart
                  data={dailyData}
                  index="date"
                  categories={["Input Tokens", "Output Tokens", "Total Tokens"]}
                  colors={["indigo", "blue", "purple"]}
                  yAxisWidth={60}
                  showLegend={true}
                  showGridLines={false}
                  showAnimation={true}
                  className="h-80"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No data available for the selected date range</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Try using Zynk more to generate usage data</p>
                  <Link href="/chat" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    New Chat
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="mt-0">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6">
              {tokenUsage.totalTokens > 0 ? (
                <BarChart
                  data={[
                    {
                      category: "Token Distribution",
                      "Input Tokens": tokenUsage.totalInputTokens,
                      "Output Tokens": tokenUsage.totalOutputTokens,
                    }
                  ]}
                  index="category"
                  categories={["Input Tokens", "Output Tokens"]}
                  colors={["indigo", "blue"]}
                  showLegend={true}
                  showGridLines={false}
                  showAnimation={true}
                  className="h-80"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No token usage data available yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Start a new chat to begin tracking token usage</p>
                  <Link href="/chat" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    New Chat
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Total Token Trend */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Total Token Trend</h2>
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            {dailyData.length > 0 ? (
              <LineChart
                data={dailyData}
                index="date"
                categories={["Total Tokens"]}
                colors={["purple"]}
                yAxisWidth={60}
                showLegend={false}
                showGridLines={false}
                showAnimation={true}
                className="h-80"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No data available for the selected date range</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Try using Zynk more to generate usage data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TokenUsageLoading() {
  return (
    <div className="space-y-8">
      {/* Skeleton for Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Skeleton for Charts */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Skeleton for Total Token Trend */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
