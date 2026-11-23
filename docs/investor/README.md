# Relok8 investor deck

Files in this folder:

- `Relok8-Pre-Seed-Pitch-Deck.pptx` — editable master deck.
- `Relok8-Pre-Seed-Pitch-Deck.pdf` — presentation/export copy.
- `FOUNDER-PITCH-SCRIPT.md` — 7–9 minute talk track and preparation checklist.
- `FUND-TARGETING-NOTES.md` — how to adapt the master deck for PropTech, marketplace, CEE, European and grant reviewers.
- `PITCH-DECK-AUDIT.md` — sourced 100-point review, revenue scenario explanation and the work required to reach a 90+ deck.
- `assets/relok8-live-home.png` — public product screenshot used in the deck.

## Rebuild

From the repository root:

```bash
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules \
  node scripts/build-investor-deck.cjs
soffice --headless --convert-to pdf --outdir docs/investor \
  docs/investor/Relok8-Pre-Seed-Pitch-Deck.pptx
```

## Claims discipline

The deck distinguishes live capabilities, proposed next work, roadmap items, targets and illustrative pricing. Payments, escrow and financial custody are not represented as live. Any financial feature should use licensed partners and be reviewed by qualified legal and regulatory advisers.

The revenue slide is an assumption-based scenario, not a forecast. Its launch pricing formula is:

`49 PLN × approved reservations + 49 PLN × active landlord-tenancy months`

The displayed scenarios assume ten paid landlord months per approved tenancy, 23% illustrative VAT and a model conversion rate of 4.30 PLN/€. Pricing, VAT treatment, refund rules and average tenure must be validated before the scenarios are treated as forecasts.

The base scenarios exclude optional future revenue from insurance, utilities, connectivity, moving and FX referrals; institutional plans; partner-led payment services; and API usage. International students are the quantified beachhead, while the product is intended for other foreign nationals and local renters as well.

