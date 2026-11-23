# Relok8 49 + 49 launch pricing

## Public model

- Incoming tenant: **49 PLN once**, only after landlord approval, to confirm the reservation.
- Landlord: **49 PLN per active tenancy month**, starting at move-in and ending with the tenancy.
- Search, listing, application, messaging, translation and handover coordination: included.
- No mandatory placement commission, departing-tenant fee, search subscription or unexplained card hold.

International students are an initial high-need, high-density acquisition segment—not an eligibility restriction. The same prices and workflow can serve other foreign nationals and people moving locally, subject to market testing and localised pricing outside Poland.

Optional future revenue may come from insurance, utilities, connectivity, moving and FX referrals; university, employer and property-operator plans; partner-led payment services; and API or embedded-workflow usage. These services are not required to use the core marketplace and are excluded from the base 49 + 49 revenue scenarios.

The canonical application constants live in `src/config/pricing.ts`. A price snapshot is written to an application when the landlord approves it so later price changes do not silently alter that approved workflow.

## Current payment status

The pricing rules and approval-gated quote are implemented, but payment collection remains deliberately disabled. `convex/payments.ts` returns a quote with `charged: false` and `checkoutEnabled: false`; every mutation capable of charging, holding, capturing or refunding still fails closed.

Before activating checkout:

1. Select and contract with a payment provider that supports the intended Polish and EU flow.
2. Review VAT, invoices, refunds, cancellation rights, recurring-payment consent and consumer disclosures with qualified Polish advisers.
3. Add provider secrets only to the server-side Convex environment.
4. Implement provider-hosted checkout and signed webhooks; never accept raw card details in Relok8.
5. Make the 49 PLN tenant fee payable only for the approved applicant.
6. Start landlord recurring billing only on the recorded move-in date; stop it when the tenancy ends or is cancelled.
7. Test success, cancellation, duplicate webhook, refund, failed renewal and tenancy-end flows before enabling production charging.

Rent, deposits and payments between rental participants remain outside the platform fee flow. Relok8 must not describe itself as holding escrow unless a licensed, reviewed partner arrangement is actually live.

