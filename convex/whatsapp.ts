import { action } from './_generated/server';
import { v } from 'convex/values';
const unavailable = async (): Promise<never> => { throw new Error('Automated WhatsApp delivery and webhook replies are not enabled. Use the share link or in-app landlord dashboard.'); };
export const sendLandlordApprovalAlert = action({ args: {}, handler: unavailable });
export const handleWebhookReply = action({ args: {}, handler: unavailable });
