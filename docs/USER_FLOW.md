# Relok8 guided housing workflow

Status: implementation baseline, 17 November 2026.

## Product boundary

Relok8 helps internationals in Poland find housing and coordinate a lease takeover with a departing tenant and landlord. It records decisions and participant confirmations. It does not execute legal transfers, verify signed documents, collect rent, hold escrow, or guarantee deposits. Specialist settling-in providers are a future referral feature, not part of this release.

## Assessment

The core three-party workflow is sound. The current experience makes users infer too much from separate pages, modals, and role menus. Publishing, permission to advertise, approving an applicant, and completing a handover must always be distinct. A user should be able to answer: Where am I? Who acts next? What does this action mean?

## Entry and navigation

Offer task-based guidance rather than requiring users to choose a permanent role. One account can participate in different capacities for different properties. Explore remains the primary search surface. How it works explains three paths. My Place is the source of truth for listings, invitations, applications and handover progress. Messages handles discussion; it does not imply an application or approval.

Guests may browse and read guides. Saving, messaging, publishing, and applying require authentication. Explain why sign-in is required at the action. Preserve listing drafts on the current device; never imply that a device draft is published.

## Path A: find a home

1. Explore: choose city, budget, dates and room preferences.
2. Listing: review photos, known monthly costs, bills, deposit, dates and registration information. Missing facts must remain visibly unknown.
3. Sign in when saving, messaging or applying. A failed save must not appear successful.
4. Message the tenant and agree viewing and proposed terms. Sending a message is separate from submitting a request.
5. Request landlord approval. Explain that the request neither reserves the home nor charges money.
6. My Place: show the decision and seven-day review deadline. Pending requests identify the landlord as the next actor; the listing author may need to invite them.
7. Approved: coordinate documents, deposit arrangements and keys in that order.
8. Completed: display a participant-reported handover, not a payment receipt or legal verification.

Recovery: declined, expired, withdrawn and cancelled requests explain the outcome and retain access to the listing/conversation. An expired request may be resubmitted if the listing is still accepting applicants.

## Path B: leave a lease

1. List: location → room specifications → rent and dates → photos and consent.
2. Validate required fields before advancing. Save a device draft and show save failures.
3. Review, sign in and publish. Publication is not landlord approval.
4. My Place: create a landlord invitation addressed to their email. Copy and send the link personally; the app must not claim an email was sent.
5. Answer inquiries in Messages. Track applications in My Place.
6. Landlord reviews candidates. The departing tenant cannot approve on their behalf.
7. Complete the three-party handover. Pause or republish while allowed by the backend state.

## Path C: landlord

1. Open the invitation and sign in with its intended verified email.
2. Review the property and accept the invitation within seven days. Acceptance grants access to that property; it does not approve an applicant.
3. Confirm or withdraw permission to advertise separately.
4. Review the applicant and approve or decline. Explain declines and cancellations.
5. Confirm documents, deposit arrangements and keys with the other two participants.

An invalid, expired, used or wrong-email invitation must explain the problem and ask the sender for a new invitation when appropriate. A self-selected profile role never grants property access.

## Guided handover rules

Use the backend's sequence: documents → deposit → keys. Each step needs the departing tenant, landlord and applicant to confirm independently. Show confirmations by participant and identify the first incomplete step. If the current user confirmed it, tell them they are waiting for the others. Lock later steps until all three confirm the previous steps. To correct an earlier step, later confirmations must first be removed. Never auto-confirm a step or alter financial status.

Completion means every participant confirmed every stage; the backend marks the listing transferred. Completed confirmations remain read-only. Support handles correction requests.

## First implementation slice

- Replace the broad How it works copy with a selectable guide for each task and a direct next action.
- Link to that guide prominently from Explore.
- Explain all three kinds of approval in the guide.
- Show the current handover step and waiting state in My Place.
- Disable confirmations that backend sequencing would reject, while retaining valid correction actions.
- Use English and Polish copy consistently with existing locale handling; other locales currently fall back to English for these additions.

## Follow-up slices

1. Consolidate overlapping legacy My Place/dashboard controls into the canonical workflow, after auditing their backend mappings.
2. Improve post-login action continuation and request outcomes, with two-account/three-party browser checks.
3. Add a vetted provider referral section after handover; show service scope, languages, prices and referral disclosures. Share contact details only with user consent.

## Acceptance and release checks

- Each guide path has a clear next action and remains keyboard accessible.
- Browse CTA reaches Explore, listing CTA reaches List, landlord CTA reaches My Place.
- A partial documents stage cannot unlock deposit; partial deposit cannot unlock keys.
- Waiting copy differentiates the user's own confirmation from confirmations still needed.
- Earlier confirmations cannot be removed while later confirmations exist.
- Backend authorization and state-transition tests continue to pass.
- Type checking and production build pass.
- Before release, test a guest, listing author, invited landlord and applicant with isolated accounts: draft → publish → invite → message → request → decision → all handover confirmations. Test wrong-email/expired invitations, rejected requests and mobile keyboard navigation.

Automated checks do not establish that live Clerk configuration, deployed Convex settings or browser journeys work. No production deployment is included in this implementation.
