import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Convex WhatsApp Webhook & Messaging Module
 * Dispatches interactive template notifications with quick reply buttons
 * (APPROVE_LEASE / REJECT_LEASE) to landlords for lease takeover consent.
 */

export interface WhatsAppMessagePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    header?: {
      type: "text";
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

/**
 * WhatsApp Webhook Action (sendLandlordApprovalAlert)
 * Sends an interactive WhatsApp template message to the landlord with
 * two quick reply buttons: APPROVE_LEASE and REJECT_LEASE.
 */
export const sendLandlordApprovalAlert = action({
  args: {
    listingId: v.string(),
    listingTitle: v.string(),
    landlordPhone: v.string(),
    studentName: v.string(),
    monthlyRent: v.number(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rentFormatted = `${args.monthlyRent} PLN`;

    const interactivePayload: WhatsAppMessagePayload = {
      messaging_product: "whatsapp",
      to: args.landlordPhone,
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "Relok8 • Lease Takeover Notice (Art. 509 KC)",
        },
        body: {
          text: `Dzień dobry! Student ${args.studentName} has placed a verified 15-minute EarlyLock hold on your listing: "${args.listingTitle}" (${rentFormatted}/mo).\n\nFull deposit and identity verified. Do you approve the tenant takeover under Polish Civil Code Art. 509 KC?`,
        },
        footer: {
          text: `EarlyLock ID: ${args.stripePaymentIntentId.slice(-8)}`,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `APPROVE_LEASE_${args.stripePaymentIntentId}`,
                title: "APPROVE_LEASE",
              },
            },
            {
              type: "reply",
              reply: {
                id: `REJECT_LEASE_${args.stripePaymentIntentId}`,
                title: "REJECT_LEASE",
              },
            },
          ],
        },
      },
    };

    // In production with WHATSAPP_API_TOKEN set, dispatches to WhatsApp Cloud API graph.facebook.com:
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1092837482910";

    let dispatchStatus = "SIMULATED_SUCCESS";
    let apiResponse: any = null;

    if (whatsappToken) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(interactivePayload),
          }
        );
        apiResponse = await response.json();
        dispatchStatus = response.ok ? "DISPATCHED" : "FAILED";
      } catch (err: any) {
        dispatchStatus = "NETWORK_ERROR";
        apiResponse = { error: err.message };
      }
    }

    return {
      success: true,
      dispatchStatus,
      recipient: args.landlordPhone,
      interactivePayload,
      apiResponse,
      quickReplyButtons: ["APPROVE_LEASE", "REJECT_LEASE"],
      sentAt: Date.now(),
      message: `Interactive WhatsApp alert generated for landlord ${args.landlordPhone}. Quick reply buttons: APPROVE_LEASE / REJECT_LEASE.`,
    };
  },
});

/**
 * Handle incoming WhatsApp Webhook callbacks
 */
export const handleWebhookReply = action({
  args: {
    buttonReplyId: v.string(),
  },
  handler: async (ctx, args) => {
    const isApproval = args.buttonReplyId.startsWith("APPROVE_LEASE_");
    const intentId = args.buttonReplyId.replace("APPROVE_LEASE_", "").replace("REJECT_LEASE_", "");

    if (isApproval) {
      await ctx.runMutation(api.payments.captureEscrow, {
        stripePaymentIntentId: intentId,
      });
      return {
        decision: "APPROVED",
        intentId,
        message: "Landlord accepted takeover via WhatsApp button reply. Escrow captured.",
      };
    } else {
      await ctx.runMutation(api.payments.cancelEscrow, {
        stripePaymentIntentId: intentId,
        reason: "Landlord declined via WhatsApp quick reply",
      });
      return {
        decision: "REJECTED",
        intentId,
        message: "Landlord declined takeover via WhatsApp button reply. Escrow refunded.",
      };
    }
  },
});
