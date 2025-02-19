import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("telegramSessions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    return session;
  },
});

export const deleteByUserId = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("telegramSessions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return session;
  },
});

export const addSession = mutation({
  args: { 
    userId: v.string(),
    session_id: v.string(),
    createdAt: v.number(),
    username: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<string> => {
    await ctx.db.insert("telegramSessions", {
      userId: args.userId,
      session_id: args.session_id,
      createdAt: args.createdAt,
      username: args.username
    });
    return args.session_id;
  },
}); 

// Query para obtener el chat_id basado en el nickname
export const findChatIdByNickname = query({
    args: {
      nickname: v.string(),
    },
    handler: async (ctx, args) => {
      const user = await ctx.db
        .query("usersTelegram")
        .withIndex("by_nickname", (q) => q.eq("nickname", args.nickname))
        .first();
  
      if (!user) {
        throw new Error(`User with nickname ${args.nickname} not found.`);
      }
  
      return { chat_id: user.chat_id };
    },
  });
  