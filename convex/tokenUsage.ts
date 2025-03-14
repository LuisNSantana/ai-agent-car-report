import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Save token usage
export const saveTokenUsage = mutation({
  args: {
    userId: v.string(),
    chatId: v.optional(v.id("chats")),
    inputTokens: v.number(),
    outputTokens: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user ID if available
    const identity = await ctx.auth.getUserIdentity();
    let userId = args.userId;
    
    // If we have an authenticated user, use that ID instead of the provided one
    // unless the provided one is already the same as the authenticated user
    if (identity && identity.subject !== args.userId) {
      // Only log if we're replacing a non-system user ID
      if (args.userId !== "system") {
        console.log(`Replacing provided userId ${args.userId} with authenticated userId ${identity.subject}`);
      }
      userId = identity.subject;
    } else {
      console.log(`No authenticated user, using provided userId: ${userId}`);
    }
    
    // Calculate total tokens
    const totalTokens = args.inputTokens + args.outputTokens;
    
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const timestamp = Date.now();
    
    console.log("Saving token usage:", {
      userId,
      chatId: args.chatId,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens,
      model: args.model,
      date: today
    });
    
    // Insert token usage record
    const id = await ctx.db.insert("tokenUsage", {
      userId,
      chatId: args.chatId,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens,
      model: args.model,
      date: today,
      timestamp,
    });
    
    console.log("Token usage saved to database successfully");
    
    return id;
  },
});

// Get total token usage for a user
export const getTotalTokenUsage = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get the user ID from the auth context if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      userId = identity.subject;
    }
    
    console.log("Getting total token usage for user:", userId);
    
    const tokenUsages = await ctx.db
      .query("tokenUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    console.log(`Found ${tokenUsages.length} token usage records for user ${userId}`);
    
    // Calculate totals
    const totalInputTokens = tokenUsages.reduce((sum, usage) => sum + usage.inputTokens, 0);
    const totalOutputTokens = tokenUsages.reduce((sum, usage) => sum + usage.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    
    // Get unique chat IDs (filtering out undefined/null values)
    const uniqueChatIds = new Set(tokenUsages.map(u => u.chatId).filter(Boolean));
    const totalChats = uniqueChatIds.size;
    
    console.log("Token usage totals:", {
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalChats
    });
    
    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalChats,
    };
  },
});

// Get token usage by date range for a user
export const getTokenUsageByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user ID from the auth context if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      userId = identity.subject;
    }
    
    console.log(`Getting token usage for date range: ${args.startDate} to ${args.endDate} for user ${userId}`);
    
    // Query token usage for the specified date range
    const tokenUsages = await ctx.db
      .query("tokenUsage")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .collect();
    
    // Group by date
    const usageByDate = new Map<string, { input: number; output: number; total: number }>();
    
    // Initialize all dates in the range
    const startDate = new Date(args.startDate);
    const endDate = new Date(args.endDate);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      usageByDate.set(dateStr, { input: 0, output: 0, total: 0 });
    }
    
    // Sum up token usage by date
    for (const usage of tokenUsages) {
      const current = usageByDate.get(usage.date) || { input: 0, output: 0, total: 0 };
      usageByDate.set(usage.date, {
        input: current.input + usage.inputTokens,
        output: current.output + usage.outputTokens,
        total: current.total + usage.totalTokens,
      });
    }
    
    // Convert to array and sort by date
    const result = Array.from(usageByDate.entries()).map(([date, usage]) => ({
      date,
      input: usage.input,
      output: usage.output,
      total: usage.total,
    }));
    
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  },
});

// Get recent token usage (last 7 days)
export const getRecentTokenUsage = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Get the user ID from the auth context if not provided
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      userId = identity.subject;
    }
    
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];
    
    console.log("Getting recent token usage:", {
      userId,
      startDate,
      endDate
    });
    
    return await ctx.db
      .query("tokenUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(q => 
        q.gte(q.field("date"), startDate) && 
        q.lte(q.field("date"), endDate)
      )
      .collect();
  },
});

// Clear token usage data
export const clearTokenUsage = mutation({
  args: {
    userId: v.optional(v.string()),
    clearAll: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the user ID from the auth context if not provided
    let userId = args.userId;
    if (!userId && !args.clearAll) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      userId = identity.subject;
    }
    
    let deletedCount = 0;
    
    if (args.clearAll) {
      // Only allow clearing all data for authorized users (you might want to add admin check here)
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthorized");
      }
      
      console.log("Clearing all token usage data");
      
      // Get all token usage records
      const allTokenUsages = await ctx.db
        .query("tokenUsage")
        .collect();
      
      // Delete each record
      for (const usage of allTokenUsages) {
        await ctx.db.delete(usage._id);
        deletedCount++;
      }
    } else if (userId) {
      console.log(`Clearing token usage data for user: ${userId}`);
      
      // Get token usage records for the specified user
      const userTokenUsages = await ctx.db
        .query("tokenUsage")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      // Delete each record
      for (const usage of userTokenUsages) {
        await ctx.db.delete(usage._id);
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} token usage records`);
    
    return { deletedCount };
  },
});
