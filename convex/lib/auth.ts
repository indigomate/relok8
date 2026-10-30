import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

type AuthCtx = Pick<QueryCtx | MutationCtx | ActionCtx, "auth">;
export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  return identity;
}
export async function requireSelf(ctx: AuthCtx, userId?: string) {
  const identity = await requireIdentity(ctx);
  if (userId && identity.subject !== userId) throw new Error("Forbidden");
  return identity;
}
export async function requireAdmin(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);
  const admins = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!admins.includes(identity.subject)) throw new Error("Forbidden");
  return identity;
}
export async function requireOwner(ctx: AuthCtx, record: { ownerId?: string } | null) {
  const identity = await requireIdentity(ctx);
  if (!record || record.ownerId !== identity.subject) throw new Error("Forbidden");
  return identity;
}
export async function requireLandlord(ctx: AuthCtx, record: { landlordContactEmail?: string } | null) {
  const identity = await requireIdentity(ctx);
  if (!record || !(record as any).landlordUserId && (identity.emailVerified !== true || !identity.email || record.landlordContactEmail?.trim().toLowerCase() !== identity.email.toLowerCase()) || ((record as any)?.landlordUserId && (record as any).landlordUserId !== identity.subject)) throw new Error("Forbidden");
  return identity;
}
export function publicListing<T extends Record<string, any>>(record: T): T {
  const { landlordContactEmail, ownerId, landlordUserId, placeState, lockedByUserId, reservedByName, ...safe } = record;
  return { ...safe, advertisingPermission: placeState?.advertisingPermission === true } as unknown as T;
}
export function validateListing(args: Record<string, any>) {
  if (!args.title?.trim() || args.title.length > 160 || !args.address?.trim() || args.address.length > 500 || !args.city?.trim()) throw new Error("Invalid listing details");
  if (!Number.isFinite(args.monthlyRent) || args.monthlyRent <= 0 || args.monthlyRent > 100000 || !Number.isFinite(args.deposit) || args.deposit < 0 || args.deposit > 1000000 || args.areaM2 <= 0) throw new Error("Invalid listing amounts");
  for (const field of ["moveInDate", "leaseEndDate"]) if (!/^\d{4}-\d{2}-\d{2}$/.test(args[field]) || Number.isNaN(Date.parse(args[field]))) throw new Error("Invalid date");
  if (args.leaseEndDate < args.moveInDate) throw new Error("Lease ends before move-in");
  if ((args.images?.length || 0) > 12 || (args.description?.length || 0) > 10000) throw new Error("Listing too large");
  for (const image of args.images || []) if (typeof image !== "string" || image.length > 2000000 || !/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(image)) throw new Error("Invalid image");
}
