import { describe, test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { invalidListingStep, knownMonthlyCost } from "../src/utils/listingFlow";
import { parseRoute } from "../src/utils/router";
const modules = import.meta.glob("../convex/**/*.{ts,js}");
const ident = (subject: string) => ({
  subject,
  issuer: "https://clerk.example.test",
  name: subject,
  email: subject + "@example.test",
  emailVerified: true,
});
const listing = {
  title: "Room",
  address: "Test Street",
  city: "Warsaw",
  monthlyRent: 2000,
  deposit: 2000,
  roomType: "Studio",
  areaM2: 25,
  floor: 0,
  moveInDate: "2027-01-01",
  leaseEndDate: "2027-06-30",
  amenities: [],
  images: [],
  landlordContactEmail: "landlord@example.test",
};
async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity(ident("owner")),
    a = t.withIdentity(ident("a")),
    b = t.withIdentity(ident("b")),
    landlord = t.withIdentity(ident("landlord"));
  const id = await owner.mutation(api.leases.create, listing);
  return { t, owner, a, b, landlord, id };
}
const apply = (client: any, id: string) =>
  client.mutation(api.workflow.request, {
    listingId: id,
    message: "I would like a viewing and to move in January.",
  });
describe("new housing journeys", () => {
  test("request is idempotent, private, and does not lock the listing", async () => {
    const { t, owner, a, b, id } = await setup();
    const request = await apply(a, id);
    expect(await apply(a, id)).toBe(request);
    expect((await t.query(api.leases.getById, { id }))?.isLocked).toBe(false);
    expect(await b.query(api.workflow.activity, {})).toEqual([]);
    expect(
      (await owner.query(api.workflow.activity, {}))[0].applications,
    ).toHaveLength(1);
  });
  test("anonymous and self applications are rejected", async () => {
    const { t, owner, id } = await setup();
    await expect(apply(t, id)).rejects.toThrow("Authentication");
    await expect(apply(owner, id)).rejects.toThrow("own listing");
  });
  test("only landlord decides and competing approvals cannot succeed", async () => {
    const { owner, a, b, landlord, id } = await setup();
    const first = await apply(a, id),
      second = await apply(b, id);
    await expect(
      owner.mutation(api.workflow.decide, {
        applicationId: first,
        decision: "approved",
        reason: "",
      }),
    ).rejects.toThrow("Forbidden");
    const results = await Promise.allSettled(
      [first, second].map((applicationId) =>
        landlord.mutation(api.workflow.decide, {
          applicationId,
          decision: "approved",
          reason: "",
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  test("expired requests display expired and cannot be approved", async () => {
    const { t, a, landlord, id } = await setup();
    const app = await apply(a, id);
    await t.run(async (ctx) => {
      const row: any = await ctx.db.get(app);
      await ctx.db.patch(app, {
        data: { ...row!.data, expiresAt: Date.now() - 1000 },
      });
    });
    expect(
      (await a.query(api.workflow.activity, {}))[0].applications[0].status,
    ).toBe("expired");
    await expect(
      landlord.mutation(api.workflow.decide, {
        applicationId: app,
        decision: "approved",
        reason: "",
      }),
    ).rejects.toThrow("no longer active");
  });
  test("withdrawal is applicant-only and allows a later request", async () => {
    const { a, b, id } = await setup();
    const applicationId = await apply(a, id);
    await expect(
      b.mutation(api.workflow.decide, {
        applicationId,
        decision: "withdrawn",
        reason: "Changed plans",
      }),
    ).rejects.toThrow("Forbidden");
    await a.mutation(api.workflow.decide, {
      applicationId,
      decision: "withdrawn",
      reason: "Changed plans",
    });
    expect(await apply(a, id)).not.toBe(applicationId);
  });
  test("three participants confirm in order before handover completes", async () => {
    const { t, owner, a, b, landlord, id } = await setup();
    const applicationId = await apply(a, id);
    await landlord.mutation(api.workflow.decide, {
      applicationId,
      decision: "approved",
      reason: "",
    });
    await expect(
      b.mutation(api.workflow.confirm, {
        applicationId,
        step: "documents",
        confirmed: true,
      }),
    ).rejects.toThrow("Forbidden");
    await expect(
      a.mutation(api.workflow.confirm, {
        applicationId,
        step: "keys",
        confirmed: true,
      }),
    ).rejects.toThrow("previous step");
    for (const step of ["documents", "deposit", "keys"] as const) {
      for (const client of [owner, landlord, a])
        await client.mutation(api.workflow.confirm, {
          applicationId,
          step,
          confirmed: true,
        });
    }
    expect((await t.query(api.leases.getById, { id }))?.status).toBe(
      "TRANSFERRED",
    );
    expect(
      (await a.query(api.workflow.activity, {}))[0].applications[0].status,
    ).toBe("completed");
    expect(await t.query(api.leases.get, {})).toEqual([]);
  });
  test("cancelling approval returns listing to availability", async () => {
    const { t, a, landlord, id } = await setup();
    const applicationId = await apply(a, id);
    await landlord.mutation(api.workflow.decide, {
      applicationId,
      decision: "approved",
      reason: "",
    });
    await landlord.mutation(api.workflow.decide, {
      applicationId,
      decision: "cancelled",
      reason: "Dates no longer work",
    });
    expect((await t.query(api.leases.getById, { id }))?.status).toBe(
      "AVAILABLE",
    );
  });
  test("owner can pause publication and requests are blocked", async () => {
    const { t, owner, a, id } = await setup();
    await owner.mutation(api.workflow.publication, {
      listingId: id,
      published: false,
    });
    expect(await t.query(api.leases.get, {})).toEqual([]);
    await expect(apply(a, id)).rejects.toThrow("not accepting");
    await expect(
      a.mutation(api.workflow.publication, { listingId: id, published: true }),
    ).rejects.toThrow("Forbidden");
  });
  test("advertising permission is separately confirmed by the landlord", async () => {
    const { t, owner, landlord, id } = await setup();
    await expect(
      owner.mutation(api.workflow.permission, {
        listingId: id,
        approved: true,
      }),
    ).rejects.toThrow("Forbidden");
    await landlord.mutation(api.workflow.permission, {
      listingId: id,
      approved: true,
    });
    expect(
      ((await t.query(api.leases.getById, { id })) as any)
        ?.advertisingPermission,
    ).toBe(true);
    expect((await t.query(api.leases.getById, { id }))?.status).toBe(
      "AVAILABLE",
    );
  });
  test("reports have durable receipts and are private to the reporter", async () => {
    const { a, b, id } = await setup();
    const receipt = await a.mutation(api.workflow.report, {
      listingId: id,
      reason: "The address does not match the photos.",
    });
    const mine = await a.query(api.workflow.myReports, {});
    expect(mine[0].id).toBe(receipt);
    expect(mine[0].status).toBe("received");
    expect(await b.query(api.workflow.myReports, {})).toEqual([]);
    await expect(b.query(api.workflow.reviewReports, {})).rejects.toThrow(
      "Forbidden",
    );
  });
});
describe("listing form and links", () => {
  test("required steps cannot be skipped and zero charges remain valid", () => {
    const d: any = {
      district: "",
      address: "",
      squareMeters: "",
      monthlyRentPLN: "",
      czynszAdminPLN: "",
      depositPLN: "",
      availableDate: "",
      leaseEndDate: "",
      photos: [],
      landlordEmail: "",
    };
    expect(invalidListingStep(d)).toBe(1);
    Object.assign(d, { district: "Centre", address: "Test Street" });
    expect(invalidListingStep(d)).toBe(2);
    d.squareMeters = "25";
    expect(invalidListingStep(d)).toBe(3);
    Object.assign(d, {
      monthlyRentPLN: "2000",
      czynszAdminPLN: "0",
      depositPLN: "0",
      availableDate: "2027-01-01",
      leaseEndDate: "2027-06-01",
    });
    expect(invalidListingStep(d)).toBe(4);
    Object.assign(d, {
      photos: ["photo"],
      landlordEmail: "landlord@example.test",
    });
    expect(invalidListingStep(d)).toBeNull();
    d.leaseEndDate = "2026-01-01";
    expect(invalidListingStep(d)).toBe(3);
  });
  test("known monthly cost includes administration exactly once", () => {
    expect(
      knownMonthlyCost({ monthlyRentPLN: 2000, czynszAdminPLN: 350 }),
    ).toBe(2350);
  });
  test("Convex listing IDs survive title slugs and Polish routes", () => {
    expect(
      parseRoute("/listing/j123abc-bright-room-in-warsaw", "", "").listingId,
    ).toBe("j123abc");
    expect(parseRoute("/pl/listing/j123abc-bright-room", "", "").locale).toBe(
      "pl",
    );
    expect(parseRoute("/listing/rel-waw-01-room", "", "").listingId).toBe(
      "rel-waw-01",
    );
  });
});

describe("privacy and preservation", () => {
  test("landlord invitation context is visible only to the intended verified recipient", async () => {
    const { owner, a, landlord, id } = await setup();
    const token = "d".repeat(64);
    await owner.mutation(api.domain.write, {
      operation: "invitation",
      input: {
        placeId: id,
        email: "landlord@example.test",
        role: "landlord",
        token,
      },
    });
    expect(
      (await a.query(api.workflow.invitationPreview, { token })).error,
    ).toBeTruthy();
    expect(
      await landlord.query(api.workflow.invitationPreview, { token }),
    ).toMatchObject({ title: "Room", city: "Warsaw" });
  });
  test("optional floor is left unknown instead of inventing a floor", async () => {
    const { owner } = await setup();
    const { floor, ...withoutFloor } = listing;
    const id = await owner.mutation(api.leases.create, withoutFloor);
    expect(
      (await owner.query(api.leases.getById, { id }))?.floor,
    ).toBeUndefined();
  });
});

test('request creates a shared conversation',async()=>{const {owner,a,id}=await setup();await apply(a,id);const threads=await owner.query(api.domain.read,{operation:'threads',input:{}});expect(threads).toHaveLength(1);const messages=await owner.query(api.domain.read,{operation:'messages',input:{threadId:threads[0].id}});expect(messages[0].body).toContain('viewing');});
