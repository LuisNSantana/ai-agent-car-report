import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutación para agregar un usuario
export const addUserTelegram = mutation({
  args: {
    nickname: v.string(),
    chat_id: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar si el usuario ya existe
    const existingUser = await ctx.db
      .query("usersTelegram")
      .withIndex("by_nickname", (q) => q.eq("nickname", args.nickname))
      .first();

    if (existingUser) {
      throw new Error(`User with nickname ${args.nickname} already exists.`);
    }

    // Insertar nuevo usuario en la base de datos
    const user = await ctx.db.insert("usersTelegram", {
      nickname: args.nickname,
      chat_id: args.chat_id,
      userId: args.userId,
    });

    return user;
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

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usersTelegram")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

export const deleteByUserId = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("usersTelegram")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
    return user;
  },
});
