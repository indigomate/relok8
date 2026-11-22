import { validLeaseDates } from '../../src/utils/leaseTiming';
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
export function isLandlord(record: { landlordUserId?: string; landlordContactEmail?: string } | null | undefined, identity: { subject: string; email?: string; emailVerified?: boolean }) {
  if (!record) return false;
  if (record.landlordUserId) return record.landlordUserId === identity.subject;
  return identity.emailVerified === true && !!identity.email && record.landlordContactEmail?.trim().toLowerCase() === identity.email.trim().toLowerCase();
}
export async function requireLandlord(ctx: AuthCtx, record: { landlordUserId?: string; landlordContactEmail?: string } | null) {
  const identity = await requireIdentity(ctx);
  if (!isLandlord(record, identity)) throw new Error("Forbidden");
  return identity;
}
export function publicListing<T extends Record<string, any>>(record: T): T {
  const { landlordContactPhone, landlordContactEmail, ownerId, landlordUserId, placeState, lockedByUserId, reservedByName, ...safe } = record;
  return { ...safe, advertisingPermission: placeState?.advertisingPermission === true } as unknown as T;
}
export function validateMoney(value: unknown, positive = false, maximum = 1000000) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (positive && value <= 0) || value > maximum || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) throw new Error('Invalid amount');
}
export function validateListing(args: Record<string, any>) {
  if (!args.title?.trim() || args.title.length > 160 || !args.address?.trim() || args.address.length > 500 || !args.city?.trim()) throw new Error("Invalid listing details");
  validateMoney(args.monthlyRent, true, 100000);
  validateMoney(args.deposit);
  if (args.czynszAdmin !== undefined) validateMoney(args.czynszAdmin);
  if (args.fixedBillsPLN !== undefined) validateMoney(args.fixedBillsPLN, true);
  if (!Number.isFinite(args.areaM2) || args.areaM2 <= 0) throw new Error("Invalid listing area");
  if (!validLeaseDates(args.moveInDate, args.leaseEndDate)) throw new Error("Lease end must be after the proposed takeover date; use valid calendar dates");
  if ((args.images?.length || 0) > 12 || (args.description?.length || 0) > 10000) throw new Error("Listing too large");
  for (const image of args.images || []) if (typeof image !== "string" || image.length > 2000000 || !/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(image)) throw new Error("Invalid image");
}
