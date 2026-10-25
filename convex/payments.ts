import { action, mutation, query } from './_generated/server';
import { v } from 'convex/values';
const unavailable = async (): Promise<never> => { throw new Error('Payments are not enabled. No funds have been charged, held, captured, or refunded.'); };
export const createReservationRecord = mutation({ args: {}, handler: unavailable });
export const updateReservationStatus = mutation({ args: {}, handler: unavailable });
export const getReservations = query({ args: {}, handler: unavailable });
export const createEscrowIntent = action({ args: {}, handler: unavailable });
export const captureEscrow = mutation({ args: {}, handler: unavailable });
export const cancelEscrow = mutation({ args: {}, handler: unavailable });
