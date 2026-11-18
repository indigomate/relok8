import { describe, test, expect } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { knownMonthlyCost } from '../src/utils/listingFlow';
import { formatPLN } from '../src/utils/formatters';
import { mapConvexListingToAppListing } from '../src/lib/convex/client';
import { authReturnPath, safeReturnPath } from '../src/utils/authFlow';
const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = (subject: string, email = subject + '@example.test', emailVerified = true) => ({ subject, email, emailVerified, issuer: 'https://clerk.example.test' });
const listing = {title: 'Room', address: 'Test Street', city: 'Warsaw', monthlyRent: 2000.10, czynszAdmin: 300.20, fixedBillsPLN: 100.30, billsMode: 'fixed' as const, deposit: 2200, roomType: 'Studio', areaM2: 25, moveInDate: '2027-01-01', leaseEndDate: '2027-06-30', amenities: [], images: [], landlordContactEmail: 'old@example.test'};
async function setup() {
  const t = convexTest(schema, modules); const owner = t.withIdentity(identity('owner')); const id = await owner.mutation(api.leases.create, listing);
  return {t, owner, id, oldLandlord: t.withIdentity(identity('old')), newLandlord: t.withIdentity(identity('new'))};
}
const update = (client: any, id: string, updates: any) => client.mutation(api.domain.write, {operation: 'updatePlace', input: {placeId: id, updates}});
describe('My Place updates and public listing consistency', () => {
  test('a committed edit is reflected in owner view, catalog and direct detail without double-counting bills', async () => {
    const {t, owner, id} = await setup();
    await update(owner, id, {rentPLN: 1800.11, czynszPLN: 250.22, depositPLN: 1500.33, rules: 'Updated house rules'});
    const catalog = (await t.query(api.leases.get, {}))[0];
    const detail = await t.query(api.leases.getById, {id});
    const place = await owner.query(api.domain.read, {operation: 'place', input: {id}});
    expect(catalog).toMatchObject({monthlyRent: 1800.11, czynszAdmin: 250.22, deposit: 1500.33, description: 'Updated house rules'});
    expect(detail).toEqual(catalog);
    expect(place).toMatchObject({rentPLN: 1800.11, czynszPLN: 250.22, depositPLN: 1500.33, rules: 'Updated house rules'});
    const mapped = mapConvexListingToAppListing(detail as any);
    expect(knownMonthlyCost(mapped)).toBe(2150.63);
    expect(mapped.depositPLN).toBe(1500.33);
  });
  test('zero administration and empty optional description are saved, never replaced with stale defaults', async () => {
    const {t, owner, id} = await setup(); await update(owner,id,{czynszPLN:0,rules:''});
    expect(await t.query(api.leases.getById,{id})).toMatchObject({czynszAdmin:0,description:''});
  });
  test('invalid amounts and non-owner edits are rejected atomically', async () => {
    const {t, owner,id} = await setup();
    for (const rent of [0,-1,100000.01,1.001]) await expect(update(owner,id,{rentPLN:rent})).rejects.toThrow('Invalid amount');
    await expect(update(t.withIdentity(identity('stranger')),id,{rentPLN:1})).rejects.toThrow('Forbidden');
    expect((await t.query(api.leases.getById,{id}))?.monthlyRent).toBe(2000.10);
  });
  test('pause removes the listing from browse and republish restores its edited values', async () => {
    const {t,owner,id}=await setup(); await update(owner,id,{rentPLN:1700.55});
    await owner.mutation(api.workflow.publication,{listingId:id,published:false});
    expect(await t.query(api.leases.get,{})).toEqual([]);
    await owner.mutation(api.workflow.publication,{listingId:id,published:true});
    expect((await t.query(api.leases.get,{}))[0].monthlyRent).toBe(1700.55);
  });
});
describe('bound landlord authorization',()=>{
  test('email fallback cannot override an already-bound landlord account on legacy endpoints',async()=>{
    const {t,id,oldLandlord,newLandlord}=await setup();
    await t.run(async ctx=>{await ctx.db.patch(id,{landlordUserId:'new'});});
    await expect(oldLandlord.query(api.domain.read,{operation:'place',input:{id}})).rejects.toThrow('Forbidden');
    await expect(oldLandlord.mutation(api.domain.write,{operation:'updatePlace',input:{placeId:id,updates:{rentPLN:1}}})).rejects.toThrow('Forbidden');
    expect(await oldLandlord.query(api.leases.getByLandlordEmail,{email:'old@example.test'})).toEqual([]);
    expect(await newLandlord.query(api.domain.read,{operation:'place',input:{id}})).toMatchObject({id});
    const inquiry=await t.withIdentity(identity('prospect')).mutation(api.inquiries.sendInquiry,{listingId:id,tenantName:'Prospect',tenantEmail:'ignored',message:'Viewing?'});
    expect(await oldLandlord.query(api.inquiries.getInquiries,{listingId:id})).toEqual([]);
    expect(await newLandlord.query(api.inquiries.getInquiries,{listingId:id})).toHaveLength(1);
    await expect(oldLandlord.mutation(api.inquiries.replyToInquiry,{inquiryId:inquiry,sender:'fake',text:'no'})).rejects.toThrow('Forbidden');
  });
  test('unverified email never grants landlord fallback permissions',async()=>{
    const {t,id}=await setup();
    await expect(t.withIdentity(identity('old','old@example.test',false)).query(api.domain.read,{operation:'place',input:{id}})).rejects.toThrow('Forbidden');
  });
});
describe('exact currency and auth return destinations',()=>{
  test('adds grosze and excludes unknown usage bills and the deposit',()=>{
    expect(knownMonthlyCost({monthlyRentPLN:0.1,czynszAdminPLN:0.2})).toBe(0.3);
    expect(knownMonthlyCost({monthlyRentPLN:2000.1,czynszAdminPLN:300.2,billsMode:'usage',fixedBillsPLN:500})).toBe(2300.3);
    expect(knownMonthlyCost({monthlyRentPLN:2000,billsMode:'included',fixedBillsPLN:500})).toBe(2000);
    expect(formatPLN(2000.25)).toContain('2,000.25');
  });
  test('retains listing, locale, inbox and invitation query after authentication',()=>{
    expect(authReturnPath('/pl/place','?invite=abc')).toBe('/pl/place?invite=abc');
    expect(authReturnPath('/sign-in','?return_to=%2Fmessages%3Fthread%3Dabc')).toBe('/messages?thread=abc');
    expect(authReturnPath('/pl/sign-up','?redirect_url=%2Fpl%2Flisting%2Fabc')).toBe('/pl/listing/abc');
  });
  test('rejects external, protocol-relative, malformed and recursive auth redirects',()=>{
    for (const target of ['https://evil.test','//evil.test','/\\evil.test','/sign-in','/pl/sign-up','javascript:alert(1)']) expect(safeReturnPath(target,'/pl')).toBe('/pl');
  });
});

describe('legacy workflow protections',()=>{
  test('paused listings cannot be reserved and owners cannot reserve their own listing',async()=>{
    const {t,owner,id}=await setup();
    await expect(owner.mutation(api.leases.reserve,{leaseId:id,userId:'owner'})).rejects.toThrow('own listing');
    await owner.mutation(api.workflow.publication,{listingId:id,published:false});
    await expect(t.withIdentity(identity('prospect')).mutation(api.leases.reserve,{leaseId:id,userId:'prospect'})).rejects.toThrow('unavailable');
  });
  test('legacy invitations cannot bypass the workflow to reassign ownership',async()=>{
    const {t,id,oldLandlord}=await setup();
    await expect(oldLandlord.mutation(api.domain.write,{operation:'invitation',input:{placeId:id,email:'new@example.test',role:'tenant',token:'a'.repeat(64)}})).rejects.toThrow('takeover workflow');
    await t.run(async ctx=>{await ctx.db.insert('domainRecords',{kind:'invitation',key:'b'.repeat(64),ownerId:'old',placeId:id,data:{role:'tenant',email:'new@example.test',createdAt:Date.now()}});});
    await expect(t.withIdentity(identity('new')).mutation(api.domain.write,{operation:'acceptInvitation',input:{token:'b'.repeat(64)}})).rejects.toThrow('Invalid or expired');
    expect((await t.run(async ctx=>ctx.db.get(id)))?.ownerId).toBe('owner');
  });
  test('legacy placeState snapshots do not override current canonical prices',async()=>{
    const {t,owner,id}=await setup();
    await t.run(async ctx=>{await ctx.db.patch(id,{placeState:{rentPLN:10,czynszPLN:20,rules:'stale'}});});
    await update(owner,id,{rentPLN:1900.25,czynszPLN:0,rules:'Fresh'});
    expect(await owner.query(api.domain.read,{operation:'place',input:{id}})).toMatchObject({rentPLN:1900.25,czynszPLN:0,rules:'Fresh'});
  });
});

test('creation rejects sub-grosz or negative recurring amounts just like edits', async () => {
  const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));
  for (const patch of [{monthlyRent:1.001},{deposit:1.001},{czynszAdmin:-1},{czynszAdmin:1.001},{fixedBillsPLN:1.001}]) await expect(owner.mutation(api.leases.create,{...listing,...patch})).rejects.toThrow('Invalid amount');
});
