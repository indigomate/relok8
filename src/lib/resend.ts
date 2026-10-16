/**
 * Relok8 Resend Email Dispatcher
 * Dispatches transactional emails via Resend API (https://resend.com)
 * Handles inquiries, support messages, lease takeover (Cesja) notifications, and replies.
 */

export interface SendEmailPayload {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
}

export interface SendEmailResponse {
  id: string;
  status: 'sent' | 'simulated' | 'error';
  error?: string;
}

/**
 * Check whether Resend is actively configured with an API key
 */
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key.trim().length > 0 && !key.includes('YOUR_KEY'));
}

/**
 * Send an email via the Resend REST API (zero external SDK dependencies required)
 */
export async function sendResendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM_EMAIL || 'Relok8 <notifications@relok8.online>';
  const from = payload.from || defaultFrom;
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];

  // If no API key configured, simulate delivery in development/sandbox
  if (!isResendConfigured()) {
    const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[Resend Dev Simulator] Email to: ${to.join(', ')} | Subject: "${payload.subject}" | From: ${from}`);
    return {
      id: simId,
      status: 'simulated'
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.reply_to
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend Error]', data);
      return {
        id: '',
        status: 'error',
        error: data.message || `Resend API returned HTTP ${res.status}`
      };
    }

    return {
      id: data.id,
      status: 'sent'
    };
  } catch (err: any) {
    console.error('[Resend Network Exception]', err);
    return {
      id: '',
      status: 'error',
      error: err.message || 'Network error communicating with Resend'
    };
  }
}

/**
 * Branded HTML Templates
 */

export function buildInquiryEmailHtml(params: {
  listingTitle: string;
  studentName: string;
  studentEmail: string;
  message: string;
  listingUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #4f46e5; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 24px; font-size: 15px; line-height: 1.6; }
    .quote-box { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 4px; margin: 18px 0; font-style: italic; color: #334155; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 14px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Tenant Inquiry on Relok8</h1>
      <p>Direct housing inquiry for your listing</p>
    </div>
    <div class="body">
      <p>Hello,</p>
      <p><strong>${escapeHtml(params.studentName)}</strong> is interested in stepping into your lease or room for:</p>
      
      <div class="meta-box">
        <strong>Property:</strong> ${escapeHtml(params.listingTitle)}<br>
        <strong>Sender:</strong> ${escapeHtml(params.studentName)} (${escapeHtml(params.studentEmail)})
      </div>

      <p><strong>Message from tenant:</strong></p>
      <div class="quote-box">
        "${escapeHtml(params.message)}"
      </div>

      <p>You can reply directly to this email to coordinate a viewing or start the lease takeover (Cesja) protocol under Art. 509 KC.</p>
      
      ${params.listingUrl ? `<a href="${params.listingUrl}" class="btn">View Listing on Relok8</a>` : ''}
    </div>
    <div class="footer">
      Relok8.online · Student Housing & Peer-to-Peer Lease Transfers in Poland · Zero Agency Fees
    </div>
  </div>
</body>
</html>
  `;
}

export function buildInquiryReplyHtml(params: {
  listingTitle: string;
  senderName: string;
  replyText: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 24px; font-size: 15px; line-height: 1.6; }
    .quote-box { background: #f1f5f9; border-left: 4px solid #0f172a; padding: 14px 16px; border-radius: 4px; margin: 18px 0; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Reply to your Relok8 Inquiry</h1>
    </div>
    <div class="body">
      <p>Hello,</p>
      <p><strong>${escapeHtml(params.senderName)}</strong> has replied to your inquiry regarding <strong>${escapeHtml(params.listingTitle)}</strong>:</p>
      <div class="quote-box">
        "${escapeHtml(params.replyText)}"
      </div>
      <p>Reply to this email to continue the conversation or coordinate the contract signing.</p>
    </div>
    <div class="footer">
      Relok8.online · Transparent Housing for Students & Expats in Poland
    </div>
  </div>
</body>
</html>
  `;
}

export function buildContactSupportHtml(params: {
  name: string;
  email: string;
  subject: string;
  topic: string;
  message: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; }
    .tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <span class="tag">${escapeHtml(params.topic || 'General Support')}</span>
    <h2 style="margin-top: 12px;">Help Center Ticket: ${escapeHtml(params.subject)}</h2>
    <p><strong>From:</strong> ${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;</p>
    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; white-space: pre-wrap;">
      ${escapeHtml(params.message)}
    </div>
    <p style="font-size: 12px; color: #64748b;">Delivered via Relok8 Dispatch to info@relok8.online</p>
  </div>
</body>
</html>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
