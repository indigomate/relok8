# Listing activation and public visibility

## Product principle

Relok8 must not create fake limits, fake deadlines, or misleading pressure. The activation flow explains real reasons to list and real platform boundaries. Publishing a listing is free.

## Why a member should list

The email and listing form focus on practical value:

- Find an interested replacement before moving out.
- Keep enquiries, landlord coordination, and handover steps in one workspace.
- Show the member's supplied name and full address so interested people know who they are contacting and where the home is located.
- Pause the listing if availability changes.

Relok8 does not promise that a listing will secure a replacement, obtain landlord approval, transfer a contract, or protect a deposit.

## Lifecycle

| Moment | Action | Requirement |
| --- | --- | --- |
| Account verification | Send the welcome email | Verified email |
| Day 3 | Send the first invitation to list | Explicit marketing consent and no owned listing |
| Day 10 | Send one follow-up | Consent remains active and no owned listing |
| After day 10 | Send no more listing invitations | Two-message cap |

The daily job runs at `09:40 UTC`. Idempotency keys prevent duplicates even if the job runs again.

Delivery stops before sending when the user has withdrawn consent, the current email no longer belongs to the account, or the address is suppressed after a bounce or complaint. Publishing any listing also removes the user from the eligible audience on the next run.

## Real, disclosed boundaries

- No listing fee.
- Up to 8 photos per listing in the current interface.
- Listing visibility ends with the current lease and can be paused earlier.
- The member must be entitled to advertise the place and must confirm landlord permission and contract terms directly.
- Relok8 coordinates participants; it does not approve transfers or hold deposits.

These boundaries can be changed only when the product behavior and copy are updated together.

## Public versus private information

| Data | Public listing or conversation label | Authorized/private workflow |
| --- | --- | --- |
| Member name | Supplied account/listing name | Retained for account and workflow records |
| Avatar | Supplied listing avatar | May also remain in the account provider |
| Home address | Full supplied street address | Retained in the listing record |
| Map coordinates | Supplied map position | Retained in the listing record |
| Landlord contact | Hidden | Used only in authorized landlord coordination |
| Prospect identity | Verified profile name for conversation participants | Verified account identity remains with Clerk and protected profile data |

Members are also told to remove faces, documents, apartment numbers, and other personal information from listing photos. Free-text and images still require moderation because a member can type or upload personal data themselves.

## Verification checklist

- Create a verified account without marketing consent: no listing invitation is queued.
- Opt in and leave the account without a listing for 3 days: exactly one invitation is queued.
- Run the job again: no duplicate is created.
- Reach day 10 without listing: exactly one follow-up is queued.
- Publish a listing or withdraw consent: no further invitation is queued.
- Open a public listing: the supplied name, full address, and precise location are visible, while account IDs, landlord email, and landlord phone remain absent.
- Trigger a complaint or bounce webhook: the address is suppressed from future delivery.
