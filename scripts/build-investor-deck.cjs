const fs = require('fs');
const path = require('path');

let PptxGenJS;
try {
  PptxGenJS = require('pptxgenjs');
} catch {
  PptxGenJS = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
}

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'investor');
const ASSET_DIR = path.join(OUT_DIR, 'assets');
const PPTX_PATH = path.join(OUT_DIR, 'Relok8-Pre-Seed-Pitch-Deck.pptx');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ASSET_DIR, { recursive: true });

const A = {
  logoLight: path.join(ROOT, 'public', 'relok8-logo-for-light.png'),
  logoDark: path.join(ROOT, 'public', 'relok8-logo-for-dark.png'),
  mark: path.join(ROOT, 'public', 'relok8-mark.png'),
  hero: path.join(ROOT, 'public', 'images', 'home-hero-katowice.webp'),
  screenshot: path.join(ASSET_DIR, 'relok8-live-home-crop.png'),
};

for (const [name, value] of Object.entries(A)) {
  if (!fs.existsSync(value)) throw new Error(`Missing ${name} asset: ${value}`);
}

const C = {
  navy: '0F172A',
  navy2: '151F38',
  ink: '11182D',
  white: 'F8FAFC',
  paper: 'F6F5FB',
  mist: 'EDEFFD',
  violet: '5B45F7',
  violet2: '8B7CF6',
  coral: 'FF6B71',
  pink: 'D46EBB',
  mint: '66D9B7',
  green: '2BBF85',
  amber: 'FFBF69',
  gray: '667085',
  gray2: '98A2B3',
  line: 'D7DAE7',
  pale: 'F0F1F8',
  red: 'D94A55',
};

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Relok8';
pptx.company = 'Relok8';
pptx.subject = 'Pre-seed investor pitch deck';
pptx.title = 'Relok8 — The financial operating layer for moving home';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'OpenAI Sans',
  bodyFontFace: 'OpenAI Sans',
  lang: 'en-US',
};
pptx.defineSlideMaster({
  title: 'LIGHT',
  background: { color: C.paper },
  objects: [],
  slideNumber: { x: 12.25, y: 7.05, w: 0.55, h: 0.2, color: C.gray2, fontSize: 8, align: 'right' },
});
pptx.defineSlideMaster({
  title: 'DARK',
  background: { color: C.navy },
  objects: [],
  slideNumber: { x: 12.25, y: 7.05, w: 0.55, h: 0.2, color: '7F8AA7', fontSize: 8, align: 'right' },
});

const S = pptx.ShapeType || {};
const shape = (name) => S[name] || name;
const noLine = { color: 'FFFFFF', transparency: 100 };

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: 'OpenAI Sans',
    color: opts.color || C.ink,
    fontSize: opts.fontSize || 16,
    bold: opts.bold || false,
    margin: opts.margin === undefined ? 0 : opts.margin,
    breakLine: false,
    fit: 'shrink',
    valign: opts.valign || 'mid',
    align: opts.align || 'left',
    bullet: opts.bullet,
    paraSpaceAfterPt: opts.paraSpaceAfterPt,
    charSpacing: opts.charSpacing,
    italic: opts.italic,
    isTextBox: true,
    ...opts,
  });
}

function rect(slide, x, y, w, h, fill, radius = 0.18, line = noLine) {
  slide.addShape(shape('roundRect'), {
    x, y, w, h,
    rectRadius: radius,
    fill: typeof fill === 'string' ? { color: fill } : fill,
    line,
    radius,
  });
}

function line(slide, x, y, w, h, color = C.line, width = 1, dash = 'solid') {
  slide.addShape(shape('line'), { x, y, w, h, line: { color, width, dash } });
}

function circle(slide, x, y, d, fill, transparency = 0) {
  slide.addShape(shape('ellipse'), {
    x, y, w: d, h: d,
    fill: { color: fill, transparency },
    line: noLine,
  });
}

function pill(slide, text, x, y, w, fill, color, opts = {}) {
  rect(slide, x, y, w, opts.h || 0.34, fill, 0.17, opts.line || noLine);
  addText(slide, text.toUpperCase(), x + 0.08, y + 0.01, w - 0.16, (opts.h || 0.34) - 0.02, {
    color,
    fontSize: opts.fontSize || 8.5,
    bold: true,
    charSpacing: 1.1,
    align: 'center',
  });
}

function logo(slide, dark = false, x = 0.55, y = 0.32, w = 1.35) {
  slide.addImage({ path: dark ? A.logoDark : A.logoLight, x, y, w, h: w * (599 / 2400) });
}

function header(slide, eyebrow, title, subtitle, dark = false) {
  const fg = dark ? C.white : C.ink;
  const muted = dark ? 'AAB3CB' : C.gray;
  pill(slide, eyebrow, 0.62, 0.46, Math.max(1.25, eyebrow.length * 0.09), dark ? C.navy2 : C.mist, dark ? C.violet2 : C.violet);
  addText(slide, title, 0.62, 0.94, 12.05, 0.72, { color: fg, fontSize: 28, bold: true, valign: 'top' });
  if (subtitle) addText(slide, subtitle, 0.62, 1.68, 11.85, 0.42, { color: muted, fontSize: 12.5, valign: 'top' });
}

function footer(slide, text, dark = false) {
  addText(slide, text, 0.62, 7.05, 10.9, 0.18, { color: dark ? '7F8AA7' : C.gray2, fontSize: 7.2, valign: 'mid' });
}

function numberBadge(slide, n, x, y, fill = C.violet, color = C.white) {
  circle(slide, x, y, 0.34, fill);
  addText(slide, String(n), x, y + 0.01, 0.34, 0.31, { color, fontSize: 10, bold: true, align: 'center' });
}

function statCard(slide, x, y, w, h, value, label, note, accent = C.violet, dark = false) {
  rect(slide, x, y, w, h, dark ? C.navy2 : 'FFFFFF', 0.22, { color: dark ? '2A3656' : 'E3E5EF', width: 0.8 });
  slide.addShape(shape('rect'), { x, y, w: 0.08, h, fill: { color: accent }, line: noLine });
  addText(slide, value, x + 0.3, y + 0.2, w - 0.5, 0.55, { color: dark ? C.white : C.ink, fontSize: 25, bold: true });
  addText(slide, label, x + 0.3, y + 0.78, w - 0.5, 0.42, { color: dark ? 'DCE1F0' : C.ink, fontSize: 12, bold: true, valign: 'top' });
  addText(slide, note, x + 0.3, y + 1.22, w - 0.5, h - 1.35, { color: dark ? '98A6C7' : C.gray, fontSize: 9.5, valign: 'top' });
}

function card(slide, x, y, w, h, title, body, opts = {}) {
  const dark = !!opts.dark;
  rect(slide, x, y, w, h, opts.fill || (dark ? C.navy2 : 'FFFFFF'), 0.22, {
    color: opts.line || (dark ? '2A3656' : 'E3E5EF'),
    width: 0.8,
    transparency: opts.lineTransparency || 0,
  });
  if (opts.number !== undefined) numberBadge(slide, opts.number, x + 0.25, y + 0.24, opts.accent || C.violet);
  if (opts.tag) pill(slide, opts.tag, x + 0.25, y + 0.22, opts.tagWidth || 0.9, opts.tagFill || C.mist, opts.tagColor || C.violet, { fontSize: 7.5, h: 0.28 });
  addText(slide, title, x + 0.25, y + (opts.number !== undefined || opts.tag ? 0.75 : 0.25), w - 0.5, 0.43, {
    color: dark ? C.white : C.ink,
    fontSize: opts.titleSize || 14,
    bold: true,
    valign: 'top',
  });
  addText(slide, body, x + 0.25, y + (opts.number !== undefined || opts.tag ? 1.22 : 0.73), w - 0.5, h - (opts.number !== undefined || opts.tag ? 1.4 : 0.88), {
    color: dark ? 'AAB3CB' : C.gray,
    fontSize: opts.bodySize || 10.5,
    valign: 'top',
    breakLine: true,
  });
}

function addNotes(slide, lines) {
  slide.addNotes(Array.isArray(lines) ? lines.join('\n') : lines);
}

// 1 — Cover
{
  const slide = pptx.addSlide('DARK');
  circle(slide, 9.6, -1.7, 5.2, C.violet, 78);
  circle(slide, 10.8, 4.75, 3.3, C.coral, 82);
  circle(slide, -1.5, 5.2, 3.2, C.violet2, 88);
  logo(slide, true, 0.65, 0.45, 1.65);
  pill(slide, 'PRE-SEED · 2026', 10.82, 0.42, 1.78, C.navy2, C.violet2, { line: { color: '34405F', width: 0.8 } });
  addText(slide, 'The financial operating layer\nfor moving home.', 0.65, 1.38, 8.2, 1.72, { color: C.white, fontSize: 40, bold: true, valign: 'top', breakLine: true });
  addText(slide, 'Start with lease takeovers. Expand into trusted housing transactions.', 0.68, 3.32, 7.85, 0.7, { color: 'B9C2DA', fontSize: 17, valign: 'top' });
  rect(slide, 0.68, 4.48, 7.15, 1.13, C.navy2, 0.24, { color: '2B3655', width: 0.8 });
  addText(slide, 'LIVE WEDGE', 0.96, 4.7, 1.05, 0.24, { color: C.violet2, fontSize: 8.5, bold: true, charSpacing: 1.2 });
  addText(slide, 'Housing discovery, multilingual coordination and landlord-approved handovers.', 0.96, 4.98, 6.5, 0.36, { color: C.white, fontSize: 12.5, bold: true });
  slide.addImage({ path: A.mark, x: 9.16, y: 1.64, w: 2.95, h: 2.95 });
  addText(slide, 'relok8.online', 0.68, 6.62, 2.2, 0.28, { color: 'AAB3CB', fontSize: 10.5 });
  addText(slide, 'Indiana · Founder', 9.72, 6.62, 2.9, 0.28, { color: 'AAB3CB', fontSize: 10.5, align: 'right' });
  addNotes(slide, [
    'Relok8 is building the financial operating layer for moving home.',
    'We begin with lease takeovers, where urgency, trust and coordination problems are already acute.',
    'The live product handles discovery and handover coordination today. The roadmap adds regulated financial rails through licensed partners.',
  ]);
}

// 2 — Problem
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'PROBLEM', 'The move is already financial. The workflow is not.', 'Every relocation combines a home, a contract, a deposit, identity checks and multiple people—yet users coordinate it across disconnected tools.');
  const items = [
    ['Discovery without certainty', 'Listings do not prove landlord approval, handover readiness or who is accountable.'],
    ['Trust without infrastructure', 'Newcomers must judge people, terms and deposits before they understand the local market.'],
    ['Money outside the workflow', 'Deposits, rent and service purchases happen separately, with weak status visibility.'],
    ['Language at every handoff', 'Tenant, outgoing renter and landlord often need the same facts in different languages.'],
  ];
  items.forEach((it, i) => card(slide, 0.62 + (i % 2) * 6.1, 2.35 + Math.floor(i / 2) * 1.88, 5.78, 1.55, it[0], it[1], { number: i + 1, accent: i === 3 ? C.coral : C.violet }));
  rect(slide, 0.62, 6.25, 11.88, 0.55, C.ink, 0.2);
  addText(slide, 'Result: slow moves, abandoned listings, avoidable disputes and money changing hands before trust is established.', 0.92, 6.36, 11.28, 0.3, { color: C.white, fontSize: 11.2, bold: true, align: 'center' });
  footer(slide, 'Relok8 thesis: the winning housing marketplace will own the move workflow—not only the listing.');
  addNotes(slide, 'Do not describe this as a generic apartment-search problem. The problem is the fragmented transaction around moving: trust, contract status, identity, deposit and communication are separated.');
}

// 3 — Wedge
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'BEACHHEAD', 'Start where the pain is concentrated: lease takeovers.', 'An outgoing tenant has urgency. An incoming tenant needs trust. The landlord must approve. Relok8 coordinates all three.', true);
  const labels = [
    ['OUTGOING TENANT', 'Avoid double rent', 'Needs qualified demand and a clean exit.'],
    ['INCOMING TENANT', 'Move with confidence', 'Needs clear terms, identity and handover status.'],
    ['LANDLORD', 'Approve the right person', 'Needs control without more admin.'],
  ];
  labels.forEach((it, i) => {
    const x = 0.7 + i * 4.18;
    card(slide, x, 2.48, 3.72, 2.38, it[1], it[2], { dark: true, tag: it[0], tagWidth: 1.62, tagFill: '252F4C', tagColor: i === 2 ? C.coral : C.violet2, line: i === 1 ? C.violet : '2A3656' });
    if (i < 2) {
      line(slide, x + 3.74, 3.62, 0.42, 0, C.violet2, 1.5);
      slide.addShape(shape('chevron'), { x: x + 3.96, y: 3.49, w: 0.22, h: 0.26, fill: { color: C.violet2 }, line: noLine });
    }
  });
  rect(slide, 2.15, 5.3, 9.05, 0.95, C.white, 0.22);
  addText(slide, 'The wedge creates a verified handover record—the natural place to add payments, protection and partner services.', 2.53, 5.54, 8.3, 0.45, { color: C.ink, fontSize: 14, bold: true, align: 'center' });
  footer(slide, 'Beachhead: international students and mobile newcomers. Product scope: foreign nationals and local renters alike.', true);
  addNotes(slide, [
    'The lease-takeover wedge is structurally attractive because every side has a reason to complete the workflow.',
    'That creates a transaction record and a repeatable point where financial products can later attach.',
  ]);
}

// 4 — Live product
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'PRODUCT · LIVE', 'A real marketplace and coordination layer—not a concept.', 'Relok8 is deployed at relok8.online. The current product focuses on the trusted handover before introducing financial rails.');
  rect(slide, 0.58, 2.24, 7.42, 4.44, 'E3E5EF', 0.26, noLine);
  rect(slide, 0.68, 2.34, 7.22, 4.24, 'FFFFFF', 0.22, noLine);
  circle(slide, 0.9, 2.52, 0.09, C.coral);
  circle(slide, 1.08, 2.52, 0.09, C.amber);
  circle(slide, 1.26, 2.52, 0.09, C.mint);
  slide.addImage({ path: A.screenshot, x: 0.85, y: 2.77, w: 6.88, h: 3.56 });
  pill(slide, 'LIVE SITE', 6.55, 2.43, 1.08, C.green, C.white, { h: 0.3, fontSize: 7.5 });
  const features = [
    ['Discover & list', 'City search, listing detail, favourites and owner-controlled publishing.'],
    ['Coordinate privately', 'Messaging, enquiries, landlord invitations and handover states.'],
    ['Communicate across languages', 'Live translation architecture using Helsinki-NLP Opus-MT.'],
    ['Stay engaged', 'Welcome, unread, expiry and consent-based digest email workflows.'],
  ];
  features.forEach((it, i) => {
    numberBadge(slide, i + 1, 8.35, 2.42 + i * 1.0, i === 3 ? C.coral : C.violet);
    addText(slide, it[0], 8.82, 2.36 + i * 1.0, 3.55, 0.3, { color: C.ink, fontSize: 12, bold: true });
    addText(slide, it[1], 8.82, 2.68 + i * 1.0, 3.55, 0.5, { color: C.gray, fontSize: 9.2, valign: 'top' });
  });
  rect(slide, 8.32, 6.25, 4.08, 0.48, C.mist, 0.18);
  addText(slide, 'Payments and escrow are not live today.', 8.52, 6.35, 3.68, 0.25, { color: C.violet, fontSize: 9.5, bold: true, align: 'center' });
  footer(slide, 'Public product capture: relok8.online · 23 Nov 2026');
  addNotes(slide, [
    'Open the live product during the meeting if useful.',
    'Be explicit: Relok8 does not currently custody money or claim live escrow. That honesty makes the roadmap more credible.',
  ]);
}

// 5 — Workflow
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'WORKFLOW', 'One move. One shared source of truth.', 'Relok8 turns a fragmented conversation into a staged transaction that every participant can understand.', true);
  const steps = [
    ['FIND', 'Match supply and demand', 'LIVE'],
    ['VERIFY', 'Account, listing and intent', 'NEXT'],
    ['COORDINATE', 'Message, translate, invite', 'LIVE'],
    ['APPROVE', 'Landlord-controlled decision', 'LIVE'],
    ['SETTLE', 'Deposit and rent via partners', 'ROADMAP'],
    ['HAND OVER', 'Documented completion', 'NEXT'],
  ];
  steps.forEach((it, i) => {
    const x = 0.48 + i * 2.12;
    const live = it[2] === 'LIVE';
    circle(slide, x + 0.6, 2.65, 0.72, live ? C.violet : '2B3655');
    addText(slide, String(i + 1).padStart(2, '0'), x + 0.6, 2.81, 0.72, 0.28, { color: live ? C.white : '8C98B9', fontSize: 11, bold: true, align: 'center' });
    if (i < steps.length - 1) line(slide, x + 1.34, 3.01, 0.78, 0, live ? C.violet2 : '394563', 1.4, live ? 'solid' : 'dash');
    addText(slide, it[0], x + 0.1, 3.62, 1.75, 0.32, { color: C.white, fontSize: 11.2, bold: true, align: 'center' });
    addText(slide, it[1], x, 4.04, 1.96, 0.72, { color: '9DA8C4', fontSize: 8.7, align: 'center', valign: 'top' });
    pill(slide, it[2], x + 0.49, 4.88, 0.98, live ? '26305B' : '232D47', live ? C.violet2 : '8390B0', { h: 0.28, fontSize: 7.2, line: { color: live ? C.violet : '34405F', width: 0.7 } });
  });
  rect(slide, 1.22, 5.72, 10.88, 0.64, C.navy2, 0.2, { color: '2A3656', width: 0.8 });
  addText(slide, 'The roadmap adds financial services only where workflow evidence and consent already exist.', 1.52, 5.89, 10.28, 0.3, { color: C.white, fontSize: 12.2, bold: true, align: 'center' });
  footer(slide, 'Status labels describe product readiness as of 23 Nov 2026.', true);
  addNotes(slide, 'Walk investors through the status labels. Live means implemented. Next means the immediate product layer. Roadmap means dependent on partner, compliance and legal validation.');
}

// 6 — Roadmap
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'FINPROPTECH ROADMAP', 'From marketplace to trusted housing transaction infrastructure.', 'The expansion is sequenced so regulation, risk and capital intensity grow only after the workflow proves demand.');
  const phases = [
    {
      tag: 'PHASE 1 · LIVE',
      title: 'Marketplace + coordination',
      body: 'Lease-takeover discovery\nMessaging and translation\nLandlord invitation and approval\nEmail lifecycle automation',
      color: C.violet,
    },
    {
      tag: 'PHASE 2 · 6–12 MONTHS',
      title: 'Partner-led financial rails',
      body: 'Identity and KYC handoff\nDeposit and rent initiation\nInsurance and utilities referrals\nStatus and reconciliation layer',
      color: C.pink,
    },
    {
      tag: 'PHASE 3 · 12–24 MONTHS',
      title: 'B2B operating layer',
      body: 'Tenant passport and consented history\nLandlord/residence dashboard\nRisk and workflow analytics\nPartner API and embedded services',
      color: C.coral,
    },
  ];
  phases.forEach((p, i) => {
    const x = 0.63 + i * 4.17;
    rect(slide, x, 2.3, 3.76, 3.65, 'FFFFFF', 0.24, { color: i === 0 ? C.violet : 'E1E4EE', width: i === 0 ? 1.4 : 0.8 });
    slide.addShape(shape('rect'), { x, y: 2.3, w: 3.76, h: 0.11, fill: { color: p.color }, line: noLine });
    pill(slide, p.tag, x + 0.28, 2.68, 1.72, i === 0 ? C.mist : C.pale, p.color, { h: 0.29, fontSize: 7.2 });
    addText(slide, p.title, x + 0.28, 3.18, 3.2, 0.65, { color: C.ink, fontSize: 17, bold: true, valign: 'top' });
    addText(slide, p.body, x + 0.28, 4.02, 3.12, 1.5, { color: C.gray, fontSize: 10.5, valign: 'top', breakLine: true, breakLineOnOverflow: false, lineSpacingMultiple: 1.15 });
  });
  rect(slide, 1.02, 6.22, 11.0, 0.53, C.ink, 0.18);
  addText(slide, 'Regulatory principle: licensed partners hold and safeguard funds; Relok8 orchestrates the consented workflow and status.', 1.32, 6.34, 10.4, 0.28, { color: C.white, fontSize: 10.5, bold: true, align: 'center' });
  footer(slide, 'Roadmap is proposed and subject to partner diligence, legal review and market validation.');
  addNotes(slide, [
    'Call Relok8 a FinPropTech because housing workflow and financial services converge here.',
    'Do not say Relok8 will hold customer money. Say licensed partners hold and safeguard funds while Relok8 owns the user experience and transaction status.',
  ]);
}

// 7 — Business model
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'BUSINESS MODEL', '49 once. 49 monthly. Nothing else is mandatory.', 'Search, listing, messaging, translation and handover coordination are included; optional services add upside later.', true);
  const models = [
    ['49 PLN once', 'Reservation confirmation fee paid by the incoming tenant only after the landlord accepts. No approval, no charge.', 'TENANT'],
    ['49 PLN / month', 'Paid by the landlord for each active tenancy, from move-in until the tenancy ends. Listing and applicant review stay free.', 'LANDLORD'],
    ['Optional upside', 'Partner commissions from insurance, utilities, connectivity, moving and FX; institutional plans, payments and API usage later.', 'FUTURE'],
  ];
  models.forEach((m, i) => card(slide, 0.66 + i * 4.18, 2.42, 3.77, 2.98, m[0], m[1], { dark: true, tag: m[2], tagWidth: 1.18, tagFill: '26304C', tagColor: [C.violet2, C.pink, C.coral][i], line: i === 0 ? C.violet : '2A3656', titleSize: 18, bodySize: 10.5 }));
  rect(slide, 1.2, 5.84, 10.94, 0.58, C.white, 0.2);
  addText(slide, 'Core formula: 49 PLN once + 49 PLN × active months. Optional revenue is upside—not required access.', 1.48, 5.99, 10.38, 0.3, { color: C.ink, fontSize: 11.2, bold: true, align: 'center' });
  footer(slide, 'Launch pricing hypothesis. Future partner, institutional, payments and API revenue is excluded from the base scenarios.', true);
  addNotes(slide, 'Say the model in one breath: tenants pay 49 PLN once after landlord approval; landlords pay 49 PLN per active tenancy each month. Search, listing, messaging and translation remain free. Optional future revenue can come from partner commissions, institutional plans, payments and API usage, but none is required to use the core marketplace.');
}

// 8 — Revenue potential
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'REVENUE POTENTIAL', 'One simple price scales from Poland to a €150m+ global scenario.', 'These are transparent scenarios—not forecasts. Each assumes one approved reservation and ten paid landlord months per tenancy.', true);
  const scenarios = [
    ['POLAND', '20k', '200k', '€2.0m', '10.8m PLN gross billed', C.violet],
    ['EUROPE', '250k', '2.5m', '€25.5m', '134.8m PLN-equivalent gross billed', C.pink],
    ['GLOBAL', '1.5m', '15m', '€152.9m', '808.5m PLN-equivalent gross billed', C.coral],
  ];
  scenarios.forEach((s, i) => {
    const x = 0.65 + i * 4.18;
    rect(slide, x, 2.32, 3.78, 3.42, C.navy2, 0.24, { color: i === 0 ? C.violet : '2A3656', width: i === 0 ? 1.3 : 0.8 });
    slide.addShape(shape('rect'), { x, y: 2.32, w: 3.78, h: 0.1, fill: { color: s[5] }, line: noLine });
    pill(slide, s[0], x + 0.28, 2.67, 1.04, '252F4C', s[5], { h: 0.29, fontSize: 7.2 });
    addText(slide, s[3], x + 0.28, 3.12, 3.18, 0.66, { color: C.white, fontSize: 27, bold: true });
    addText(slide, 'illustrative annual revenue', x + 0.28, 3.75, 3.1, 0.25, { color: '9DA8C4', fontSize: 8.5, bold: true });
    line(slide, x + 0.28, 4.19, 3.1, 0, '34405F', 0.8);
    addText(slide, `${s[1]} tenancies`, x + 0.28, 4.4, 1.48, 0.3, { color: C.white, fontSize: 11.2, bold: true });
    addText(slide, `${s[2]} paid months`, x + 1.78, 4.4, 1.66, 0.3, { color: C.white, fontSize: 11.2, bold: true, align: 'right' });
    addText(slide, s[4], x + 0.28, 5.02, 3.12, 0.45, { color: 'B9C2DA', fontSize: 9.2, align: 'center', valign: 'top' });
  });
  rect(slide, 1.23, 6.08, 10.86, 0.52, C.white, 0.18);
  addText(slide, 'Broader demand includes foreign workers, expats, families, domestic movers and students; optional revenue is excluded.', 1.51, 6.2, 10.3, 0.28, { color: C.ink, fontSize: 10.2, bold: true, align: 'center' });
  footer(slide, 'Model: 539 PLN gross billed/tenancy; net of illustrative 23% VAT at 4.30 PLN/€. Local pricing will vary. Not a forecast.', true);
  addNotes(slide, [
    'Explain the formula before the headline number: 49 PLN once plus 49 PLN for each of ten active landlord months equals 539 PLN gross billed per tenancy.',
    'For investor revenue, the model removes an illustrative 23% VAT and converts at 4.30 PLN per euro, producing about €102 net revenue per tenancy.',
    'Poland: 20,000 × €101.91 = €2.04m. Europe: 250,000 × €101.91 = €25.48m. Global: 1.5m × €101.91 = €152.86m.',
    'These are scenarios. They become forecasts only after the 49 + 49 pricing, average paid months, conversion, refunds, churn and local price adaptation are validated.',
  ]);
}

// 9 — Market and expansion
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'EXPANSION', 'A focused entry market. A workflow for every renter.', 'International students create a measurable beachhead; the same product serves foreign nationals, expats, workers, families and local movers.');
  statCard(slide, 0.65, 2.43, 3.72, 2.5, '108,609', 'international students in Poland', 'Phase 1: prove density in two Polish cities and convert residences and operators. 2024/25.', C.violet);
  statCard(slide, 4.79, 2.43, 3.72, 2.5, '1.65m', 'students from abroad in the EU', 'Phase 2: Germany, France and the Netherlands hosted 54.5% of the EU total in 2024.', C.pink);
  statCard(slide, 8.93, 2.43, 3.72, 2.5, '7.3m', 'students studying abroad globally', 'Phase 3: repeat the partner-led city playbook in the UK, Canada, Australia and other mobility hubs. 2023.', C.coral);
  const levels = [
    ['0–18 MONTHS', 'Poland · prove density with students and mobile newcomers'],
    ['18–36 MONTHS', 'Europe · expand across local renters, employers and institutions'],
    ['36–60 MONTHS', 'Global hubs · repeat the workflow across renter segments'],
  ];
  levels.forEach((l, i) => {
    const y = 5.39 + i * 0.43;
    pill(slide, l[0], 0.67, y, 1.08, [C.violet, C.pink, C.coral][i], C.white, { h: 0.29, fontSize: 7 });
    addText(slide, l[1], 2.0, y - 0.01, 10.28, 0.31, { color: C.ink, fontSize: 10.3, bold: i === 0 });
  });
  footer(slide, 'Student mobility sizes the beachhead—not the total market. Sources: Statistics Poland, Eurostat and UNESCO.');
  addNotes(slide, [
    'This is a sequenced expansion strategy, not a promise to launch many countries at once.',
    'Poland is the operating laboratory. Europe follows using city density and local regulated partners. Global expansion begins only after the playbook is repeatable.',
    'Say this clearly: international students are the launch wedge, not the product boundary. The workflow also serves other foreign nationals and local renters.',
  ]);
}

// 10 — Go-to-market
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'GO-TO-MARKET', 'Build density city by city. Win supply before buying reach.', 'The initial motion combines high-intent tenant acquisition with partners who already aggregate supply and trust.', true);
  const lanes = [
    ['1', 'Seed supply', 'Outgoing tenants, local housing groups, residences, relocation communities and landlord portfolios.'],
    ['2', 'Own intent', 'SEO around lease exits, city landing pages, WhatsApp groups and referral loops.'],
    ['3', 'Close the handover', 'Concierge the first transactions to learn objections, timings and partner needs.'],
    ['4', 'Convert institutions', 'Turn repeated workflows into paid pilots with residences, universities and operators.'],
  ];
  lanes.forEach((l, i) => {
    const y = 2.35 + i * 0.9;
    numberBadge(slide, l[0], 0.72, y + 0.05, i === 3 ? C.coral : C.violet);
    addText(slide, l[1], 1.23, y, 2.22, 0.32, { color: C.white, fontSize: 13.5, bold: true });
    addText(slide, l[2], 3.48, y, 8.72, 0.55, { color: 'AAB3CB', fontSize: 10.5, valign: 'top' });
    if (i < lanes.length - 1) line(slide, 0.89, y + 0.47, 0, 0.47, '394563', 1.2, 'dash');
  });
  rect(slide, 0.72, 6.02, 11.65, 0.53, '202B46', 0.18, { color: '34405F', width: 0.8 });
  addText(slide, 'North-star metric: completed, landlord-approved handovers per active listing—not raw sign-ups.', 1.02, 6.15, 11.05, 0.28, { color: C.white, fontSize: 11.3, bold: true, align: 'center' });
  footer(slide, 'Proposed launch: Lublin + one larger city, then repeat across renter communities and supply partners.', true);
  addNotes(slide, 'Funds will respond better to a density strategy than a national launch claim. Emphasise supply, completed handovers and institutional pilots.');
}

// 11 — Competition
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'COMPETITIVE POSITION', 'Others own a fragment. Relok8 owns the move.', 'The opportunity is not to outspend listing portals—it is to connect discovery, approval, communication and financial partner rails.');
  // Axes
  line(slide, 1.25, 5.86, 9.55, 0, 'AEB4C6', 1.2);
  line(slide, 1.25, 2.05, 0, 3.81, 'AEB4C6', 1.2);
  addText(slide, 'LISTING / DISCOVERY', 0.82, 6.02, 2.2, 0.25, { color: C.gray, fontSize: 8.5, bold: true });
  addText(slide, 'TRANSACTION / SERVICES', 9.12, 6.02, 2.3, 0.25, { color: C.gray, fontSize: 8.5, bold: true, align: 'right' });
  addText(slide, 'SINGLE PARTY', 0.12, 5.52, 1.0, 0.25, { color: C.gray, fontSize: 8.5, bold: true, rotate: 270, align: 'center' });
  addText(slide, 'MULTI-PARTY WORKFLOW', 0.08, 2.03, 1.18, 0.25, { color: C.gray, fontSize: 8.5, bold: true, rotate: 270, align: 'center' });
  const dots = [
    ['Listing portals', 3.0, 4.88, C.gray2, 1.5],
    ['Property management', 7.05, 4.72, C.pink, 1.95],
    ['Payment providers', 9.18, 5.18, C.coral, 1.75],
    ['Messaging tools', 4.32, 3.18, C.mint, 1.48],
  ];
  dots.forEach((d) => {
    circle(slide, d[1], d[2], 0.24, d[3]);
    addText(slide, d[0], d[1] + 0.34, d[2] - 0.06, d[4], 0.34, { color: C.gray, fontSize: 9.2, bold: true });
  });
  rect(slide, 8.17, 2.25, 2.55, 1.02, C.violet, 0.22);
  slide.addImage({ path: A.mark, x: 8.34, y: 2.42, w: 0.67, h: 0.67 });
  addText(slide, 'RELOK8', 9.18, 2.46, 1.25, 0.3, { color: C.white, fontSize: 14, bold: true });
  addText(slide, 'workflow + partner rails', 9.18, 2.78, 1.25, 0.22, { color: 'DDD8FF', fontSize: 8.2 });
  rect(slide, 11.05, 2.23, 1.42, 3.6, C.ink, 0.22);
  addText(slide, 'The integration advantage', 11.25, 2.53, 1.02, 0.72, { color: C.white, fontSize: 12.2, bold: true, align: 'center', valign: 'top' });
  addText(slide, 'Identity\n\nTranslation\n\nApproval\n\nFinancial status', 11.25, 3.45, 1.02, 1.85, { color: 'B9C2DA', fontSize: 9.3, align: 'center', valign: 'top' });
  footer(slide, 'Relok8 launch model: 49 PLN once + 49 PLN monthly, with no percentage placement commission.');
  addNotes(slide, 'Avoid claiming that competitors lack every capability. If asked about pricing, explain that several international marketplaces charge landlord commissions around 5–8% or variable tenant fees, while Relok8 tests a legible 49 PLN tenant confirmation and 49 PLN monthly active-tenancy charge.');
}

// 12 — Defensibility
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'DEFENSIBILITY', 'The moat compounds with every completed move.', 'Not “AI” by itself. The defensibility is a consented workflow dataset, distribution density and partner integration around a high-stakes event.', true);
  const moat = [
    ['Workflow graph', 'Who did what, when, with which approval and handover state.'],
    ['Local density', 'City-level supply, referrals and response-time advantage.'],
    ['Trust layer', 'Verified accounts, listing ownership and consented history.'],
    ['Partner surface', 'Reusable integrations for KYC, payments, protection and services.'],
    ['Language layer', 'Consistent multilingual communication across every transaction step.'],
  ];
  moat.forEach((m, i) => {
    const angle = (Math.PI * 2 * i) / moat.length - Math.PI / 2;
    const x = 6.28 + Math.cos(angle) * 3.95;
    const y = 4.15 + Math.sin(angle) * 1.25;
    line(slide, 6.62, 4.26, x - 6.45, y - 4.10, '34405F', 1.0, 'dash');
    rect(slide, x - 1.32, y - 0.45, 2.64, 0.92, C.navy2, 0.2, { color: i === 0 ? C.violet : '2A3656', width: i === 0 ? 1.3 : 0.8 });
    addText(slide, m[0], x - 1.12, y - 0.33, 2.24, 0.25, { color: C.white, fontSize: 10.7, bold: true, align: 'center' });
    addText(slide, m[1], x - 1.12, y - 0.04, 2.24, 0.39, { color: '9DA8C4', fontSize: 7.7, align: 'center', valign: 'top' });
  });
  circle(slide, 5.72, 3.35, 1.82, C.violet);
  slide.addImage({ path: A.mark, x: 6.12, y: 3.75, w: 1.02, h: 1.02 });
  addText(slide, 'COMPLETED\nMOVE', 5.93, 4.68, 1.4, 0.55, { color: C.white, fontSize: 9.2, bold: true, align: 'center', valign: 'top' });
  footer(slide, 'Data use must remain purpose-limited, consented and privacy-compliant.', true);
  addNotes(slide, 'Do not say the translation model is the moat. The moat is the end-to-end workflow, dense local supply, trust signals and partner surface created by completed handovers.');
}

// 13 — Readiness
{
  const slide = pptx.addSlide('LIGHT');
  header(slide, 'WHAT IS DE-RISKED', 'The product works. The next proof is marketplace repeatability.', 'The round is designed to convert technical readiness into verified demand, completed handovers and institutional pilots.');
  const ready = [
    ['DEPLOYED', 'Production web app', 'relok8.online with authenticated user flows'],
    ['OPERATING', 'Lifecycle communication', 'Email delivery, consent preferences and webhook handling'],
    ['BUILT', 'Cross-party workflow', 'Messaging, inquiries, approvals and listing controls'],
    ['ARCHITECTED', 'Multilingual layer', 'Live-translation path with Helsinki-NLP Opus-MT'],
  ];
  ready.forEach((r, i) => {
    const y = 2.38 + i * 0.86;
    pill(slide, r[0], 0.7, y + 0.04, 1.18, i === 0 ? C.green : C.mist, i === 0 ? C.white : C.violet, { h: 0.3, fontSize: 7.3 });
    addText(slide, r[1], 2.05, y, 2.65, 0.3, { color: C.ink, fontSize: 11.5, bold: true });
    addText(slide, r[2], 4.6, y, 3.14, 0.48, { color: C.gray, fontSize: 9.3, valign: 'top' });
  });
  rect(slide, 8.05, 2.34, 4.54, 3.78, C.ink, 0.26);
  pill(slide, 'NEXT 90 DAYS', 8.37, 2.7, 1.42, '262F4C', C.violet2, { h: 0.3, fontSize: 7.4 });
  const goals = [
    'Launch one dense city cohort',
    'Concierge 25 completed handovers',
    'Secure 3 institutional design partners',
    'Validate willingness to pay and partner attach',
  ];
  goals.forEach((g, i) => {
    numberBadge(slide, i + 1, 8.39, 3.35 + i * 0.59, i === 3 ? C.coral : C.violet);
    addText(slide, g, 8.84, 3.33 + i * 0.59, 3.34, 0.34, { color: C.white, fontSize: 10.4, bold: i === 1 });
  });
  addText(slide, 'Before sending: add verified current users, listings, enquiries and completed handovers here if available.', 0.7, 6.39, 7.0, 0.28, { color: C.red, fontSize: 8.8, bold: true });
  footer(slide, 'Technical readiness is evidenced; customer traction metrics must be inserted only after verification.');
  addNotes(slide, [
    'Do not invent traction. If current verified metrics are available, replace the red editing note with four numbers.',
    'Until then, present the round as a disciplined validation round built on a functioning product.',
  ]);
}

// 14 — Raise
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'THE RAISE', '€250k pre-seed to prove the move economics.', 'An 18-month round to reach repeatable city-level handovers, institutional pilots and a partner-ready financial workflow.', true);
  addText(slide, '€250k', 0.72, 2.37, 4.1, 1.02, { color: C.white, fontSize: 46, bold: true });
  addText(slide, 'target round · ≈ PLN 1.1m', 0.75, 3.4, 3.6, 0.35, { color: '9DA8C4', fontSize: 12 });
  rect(slide, 0.72, 4.12, 4.17, 1.65, C.navy2, 0.24, { color: '2A3656', width: 0.8 });
  addText(slide, '18-MONTH TARGETS', 1.02, 4.4, 1.6, 0.25, { color: C.violet2, fontSize: 8, bold: true, charSpacing: 1.2 });
  addText(slide, '2 dense cities · 1,000 verified users\n250 active listings · 100 completed handovers\n3 institutional pilots', 1.02, 4.77, 3.55, 0.75, { color: C.white, fontSize: 11.3, bold: true, valign: 'top', breakLine: true });
  const alloc = [
    ['35%', 'Product + compliance', C.violet],
    ['30%', 'City launch + growth', C.pink],
    ['20%', 'Operations + trust', C.coral],
    ['15%', 'Founder runway + admin', C.mint],
  ];
  alloc.forEach((a, i) => {
    const y = 2.31 + i * 0.9;
    rect(slide, 5.65, y, 6.65, 0.67, '202B46', 0.18, { color: '34405F', width: 0.7 });
    rect(slide, 5.65, y, 0.1, 0.67, a[2], 0, noLine);
    addText(slide, a[0], 5.98, y + 0.12, 0.83, 0.37, { color: C.white, fontSize: 16, bold: true });
    addText(slide, a[1], 7.05, y + 0.15, 4.85, 0.3, { color: 'DCE1F0', fontSize: 11.2, bold: true });
  });
  rect(slide, 5.65, 6.03, 6.65, 0.48, C.white, 0.17);
  addText(slide, 'Compatible with a blended grant + angel / pre-seed structure.', 5.93, 6.13, 6.08, 0.26, { color: C.ink, fontSize: 10.3, bold: true, align: 'center' });
  footer(slide, 'Targets and allocation are planning assumptions and should be updated after investor feedback.', true);
  addNotes(slide, [
    'The raise is not framed as “money so I can stop working.” It is capital for 18 months of founder focus against measurable milestones.',
    'If applying to a smaller grant, keep the milestone logic and resize the ask and allocation.',
  ]);
}

// 15 — Founder / Close
{
  const slide = pptx.addSlide('LIGHT');
  circle(slide, 9.52, -1.34, 4.8, C.violet, 82);
  circle(slide, 10.65, 4.95, 3.1, C.coral, 84);
  logo(slide, false, 0.65, 0.47, 1.58);
  pill(slide, 'THE OPPORTUNITY', 0.68, 1.38, 1.6, C.mist, C.violet);
  addText(slide, 'Make every move\ntrusted, legible and\nfinancially connected.', 0.68, 1.92, 7.55, 2.45, { color: C.ink, fontSize: 36, bold: true, valign: 'top', breakLine: true });
  addText(slide, 'Relok8 already has the product wedge. This round builds the evidence, distribution and regulated partnerships to turn it into FinPropTech infrastructure.', 0.72, 4.73, 7.05, 1.04, { color: C.gray, fontSize: 14.2, valign: 'top' });
  rect(slide, 8.57, 1.55, 3.48, 4.58, C.ink, 0.3);
  slide.addImage({ path: A.mark, x: 9.62, y: 2.12, w: 1.36, h: 1.36 });
  addText(slide, 'Indiana', 8.94, 3.83, 2.74, 0.48, { color: C.white, fontSize: 21, bold: true, align: 'center' });
  addText(slide, 'Founder & CEO', 8.94, 4.3, 2.74, 0.28, { color: C.violet2, fontSize: 10.5, bold: true, align: 'center' });
  addText(slide, 'Product builder who shipped Relok8’s marketplace, workflow, messaging, email and multilingual infrastructure.', 8.95, 4.76, 2.72, 0.74, { color: 'B9C2DA', fontSize: 9.6, align: 'center', valign: 'top' });
  addText(slide, 'founder@relok8.online\nrelok8.online', 8.95, 5.55, 2.72, 0.45, { color: C.white, fontSize: 9.4, bold: true, align: 'center', valign: 'top', breakLine: true });
  addText(slide, 'Seeking investors and partners in marketplaces, property, fintech and rental mobility.', 0.72, 6.46, 7.15, 0.35, { color: C.violet, fontSize: 11, bold: true });
  footer(slide, 'Confirm the founder email and add any relevant founder-market experience before external distribution.');
  addNotes(slide, [
    'Close with the category vision, then ask for the next step: a partner introduction, a second meeting or diligence.',
    'Add Indiana’s strongest founder-market insight, relevant lived experience and any prior execution evidence before sending externally.',
  ]);
}

// 16 — Sources / Diligence notes
{
  const slide = pptx.addSlide('DARK');
  header(slide, 'APPENDIX', 'Sources, status language and investor diligence.', 'Keep this slide in the file; it signals precision even if you do not present it live.', true);
  card(slide, 0.68, 2.34, 5.92, 3.62, 'Primary market sources',
    '1. Statistics Poland — Higher education 2024/25. 108,609 foreign students.\nhttps://stat.gov.pl/en/topics/education/education/higher-education-in-the-20242025-academic-year-students-and-graduates,12,5.html\n\n2. Eurostat — 1.65m students from abroad in the EU in 2024; +4% year over year.\nhttps://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/edn-20261117-1\n\n3. UNESCO — nearly 7.3m students studied abroad in 2023.\nhttps://www.unesco.org/en/articles/number-students-higher-education-more-doubled-20-years-inequalities-remain',
    { dark: true, titleSize: 16, bodySize: 8.6, line: '2A3656' });
  card(slide, 6.89, 2.34, 5.76, 3.62, 'What each status means',
    'LIVE — present in the deployed Relok8 product.\n\nNEXT — product work proposed for the immediate validation period.\n\nROADMAP — dependent on demand, partner diligence, compliance and legal review.\n\nTARGET — a future milestone, not current traction.\n\nILLUSTRATIVE — a pricing or model assumption to test.',
    { dark: true, titleSize: 16, bodySize: 10.2, line: '2A3656' });
  rect(slide, 0.68, 6.34, 11.97, 0.43, '202B46', 0.16, { color: '34405F', width: 0.7 });
  addText(slide, 'No claim in this deck should replace financial, legal, payments, AML/KYC, consumer-protection or data-protection advice.', 0.96, 6.43, 11.42, 0.24, { color: 'B9C2DA', fontSize: 8.8, bold: true, align: 'center' });
  footer(slide, 'Prepared 23 Nov 2026 · Warsaw time · Relok8 pre-seed working deck', true);
  addNotes(slide, 'Use this slide for diligence. The language guide prevents future features or milestones from being presented as current facts.');
}

pptx.writeFile({ fileName: PPTX_PATH, compression: true }).then(() => {
  console.log(`Wrote ${PPTX_PATH}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

