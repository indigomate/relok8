import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to fetch all tasks from the 'tasks' table.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

/**
 * Mutation to insert a new task with given text.
 */
export const add = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      isCompleted: false,
    });
    return taskId;
  },
});

/**
 * Mutation to toggle a task's completion status.
 */
export const toggle = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error(`Task with id ${args.id} not found`);
    }
    await ctx.db.patch(args.id, {
      isCompleted: !task.isCompleted,
    });
    return !task.isCompleted;
  },
});
