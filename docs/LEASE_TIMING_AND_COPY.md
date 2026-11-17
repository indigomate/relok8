# Occupancy, lease dates and availability copy

17 November 2026

## Goal

Keep occupied homes seeking a replacement visible to future tenants without suggesting they are vacant today. Make timing understandable at a glance and encourage relevant enquiries. This is a researched design recommendation, not a claim that traffic or conversion has already improved.

## Research

- SpareRoom uses the familiar “Available now” and explicit future availability dates in its rental results: https://www.spareroom.co.uk/flatshare/
- HousingAnywhere supports preferred move-in/move-out dates and contacting providers early: https://answers.housinganywhere.com/en/articles/2498499-how-can-i-filter-my-search
- Nielsen Norman Group recommends plain form labels that reduce guessing and produce more accurate answers: https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- Their reading research supports noticeable headings, concise language and scannable information: https://www.nngroup.com/articles/how-people-read-online/

Relok8's occupied lease-transfer model needs one distinction conventional vacancy labels do not provide: a proposed takeover while the tenant still lives there. “Upcoming takeover” with an exact proposed date communicates that distinction. “Available soon” alone is too vague, especially for a home proposed several months ahead.

## Public wording and placement

| Situation | Main label | Supporting information |
| --- | --- | --- |
| Author reports vacant and advertised date has arrived | Available now | Vacant; agree handover |
| Vacant with a future date | Available from [date] | Future move-in date |
| Occupied with a future proposed date | Upcoming takeover | Proposed takeover date: [date]; tenant seeking a replacement |
| Occupied proposed date has passed, missing occupancy, or invalid dates | Confirm takeover timing | Ask about current occupancy and dates; show advertised date where valid |
| Current lease ended | Lease ended | Ask for updated terms; excluded from public browse |
| Paused or replacement found | Listing paused / Replacement found | No immediate availability claim |

Listing cards: prominent sharp text on a softly blurred/translucent background in the photo's upper-left area. Reserve space for Save in the upper right. Put the exact current lease end below the property title/location, separate from availability. The photo remains visible. Never blur the actual status or date text.

Listing detail: repeat the same derived status near the photo and show a full timing panel with occupancy, advertised/proposed date, current lease end and the need to agree handover terms. My Place shows the same dates and lets the owner correct them. English and Polish additions follow the app's existing language behavior; other locales use English fallback.

## Listing flow

1. Ask whether the home is currently occupied or vacant. A new UI submission must select one explicitly.
2. If occupied, ask for the proposed takeover date, not the date the tenant's original lease started.
3. If vacant, ask for the earliest move-in date.
4. Ask separately for the current lease's end date. Explain that this is not a confirmed move-out date or the expiry date of the advertisement.
5. Show the chosen occupancy and both labeled dates in the review step.
6. Legacy lease-exit/calculator shortcuts now open this same wizard instead of a separate modal with default dates.
7. Publish as accepting enquiries; never automatically label an occupied home vacant as time passes.

Existing listings have optional occupancy data for compatibility. They receive a confirm-timing label until an owner explicitly updates occupancy. No existing home is automatically classified as vacant.

## Data and validation

The existing canonical moveInDate field stores the proposed takeover/earliest move-in date; occupancyStatus is a new optional enum, occupied or vacant. leaseEndDate remains the current lease end. Public/private mapping and owner date edits use these canonical fields. A private early-exit request's leaveDate remains a separate proposed departure, not an automatic public availability change.

Calendar dates must exist; end must be strictly after takeover. Ended leases cannot be newly published, requested, reserved or approved and are removed from browse. Search dates must fit between advertised takeover and lease end. Existing handover dates cannot be changed after approval without resolving the handover. Completed handover reports may still be entered after the lease end; those reports describe what happened, not new availability.

Date-only strings display without timezone shifts. Expiry uses Poland's calendar day. Browse checks expiry at query time and while an open client updates its date once per minute. It does not infer eviction, vacancy, renewal or a guaranteed move-in date from the lease end.

## Verification and follow-up

Tests cover occupied/vacant/unknown wording, paused/taken/expired overrides, impossible and reversed dates, search boundaries, date updates across public/private reads, rejecting expired applications and Poland's timezone boundary. Browser checks cover card layouts at 320/768/1440, the occupancy-dependent listing labels and a browser in a US timezone.

Future measurement: compare qualified enquiries per listing view and signup completion across these labels. Do not promise traffic increases without measurement, invent scarcity, or show misleading inventory counts.
