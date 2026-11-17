import { describe, test, expect } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { availabilityState, validLeaseDates, matchesMoveInDate, todayInPoland, canRequestTakeover } from '../src/utils/leaseTiming';
import { mapConvexListingToAppListing } from '../src/lib/convex/client';
const modules=import.meta.glob('../convex/**/*.{ts,js}');
const identity=(subject:string)=>({subject,email:subject+'@example.test',emailVerified:true,issuer:'https://clerk.example.test'});
const listing={title:'Occupied room',address:'Test Street',city:'Warsaw',monthlyRent:2000,deposit:2000,roomType:'Studio',areaM2:25,moveInDate:'2027-01-01',leaseEndDate:'2027-06-30',occupancyStatus:'occupied' as const,amenities:[],images:[],landlordContactEmail:'landlord@example.test'};
describe('occupancy and date language',()=>{
 test('only vacant homes with an arrived date can say available now',()=>{
  const dates={availableDate:'2026-11-01',leaseEndDate:'2027-06-30'};
  expect(availabilityState({...dates,occupancyStatus:'vacant'},'en','2026-11-17').title).toBe('Available now');
  expect(availabilityState({...dates,occupancyStatus:'occupied'},'en','2026-11-17').kind).toBe('confirm');
  expect(availabilityState(dates,'en','2026-11-17').kind).toBe('confirm');
 });
 test('future occupancy distinguishes replacement search from a vacant future start',()=>{
  const dates={availableDate:'2027-01-01',leaseEndDate:'2027-06-30'};
  expect(availabilityState({...dates,occupancyStatus:'occupied'},'en','2026-11-17').title).toBe('Upcoming takeover');
  expect(availabilityState({...dates,occupancyStatus:'vacant'},'en','2026-11-17').title).toBe('Available from');
  expect(availabilityState({...dates,occupancyStatus:'occupied'},'pl','2026-11-17').title).toBe('Nadchodzące przejęcie najmu');
 });
 test('ended, paused and transferred listings cannot advertise immediate availability',()=>{
  const dates={availableDate:'2026-01-01',leaseEndDate:'2027-06-30',occupancyStatus:'vacant' as const};
  expect(availabilityState({...dates,leaseEndDate:'2026-10-01'},'en','2026-11-17').kind).toBe('ended');
  expect(availabilityState({...dates,publicationStatus:'PAUSED'},'en','2026-11-17').kind).toBe('paused');
  expect(availabilityState({...dates,publicationStatus:'TRANSFERRED'},'en','2026-11-17').kind).toBe('taken');
  expect(canRequestTakeover({...dates,publicationStatus:'PAUSED'},'2026-11-17')).toBe(false);
 });
 test('dates must be real and lease end must follow takeover; search must fit within lease',()=>{
  expect(validLeaseDates('2027-02-30','2027-06-30')).toBe(false);
  expect(validLeaseDates('2027-02-01','2027-02-01')).toBe(false);
  expect(matchesMoveInDate('2027-01-01','2027-06-30','2027-07-01')).toBe(false);
  expect(matchesMoveInDate('2027-01-01','2027-06-30','2027-02-01')).toBe(true);
  expect(todayInPoland(Date.parse('2026-11-17T23:30:00Z'))).toBe('2026-11-18');
 });
});
describe('canonical lease timing persistence',()=>{
 test('occupied listings preserve proposed dates and occupancy across private and public views',async()=>{
  const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));const id=await owner.mutation(api.leases.create,listing);
  await owner.mutation(api.domain.write,{operation:'updatePlace',input:{placeId:id,updates:{occupancyStatus:'vacant',availableFrom:'2027-02-01',leaseEndDate:'2027-08-31'}}});
  const detail=await t.query(api.leases.getById,{id});
  expect(detail).toMatchObject({occupancyStatus:'vacant',moveInDate:'2027-02-01',leaseEndDate:'2027-08-31'});
  expect(mapConvexListingToAppListing(detail as any)).toMatchObject({occupancyStatus:'vacant',availableDate:'2027-02-01',leaseEndDate:'2027-08-31'});
  expect(await owner.query(api.domain.read,{operation:'place',input:{id}})).toMatchObject({availableFrom:'2027-02-01',leaseEndDate:'2027-08-31'});
 });
 test('invalid date edits roll back and impossible/equal dates cannot be published',async()=>{
  const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));const id=await owner.mutation(api.leases.create,listing);
  await expect(owner.mutation(api.domain.write,{operation:'updatePlace',input:{placeId:id,updates:{availableFrom:'2027-07-01'}}})).rejects.toThrow('Lease end');
  expect((await t.query(api.leases.getById,{id}))?.moveInDate).toBe('2027-01-01');
  await expect(owner.mutation(api.leases.create,{...listing,moveInDate:'2027-02-30'})).rejects.toThrow('valid calendar dates');
 });
 test('expired leases leave browse and reject requests and republication',async()=>{
  const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));const id=await owner.mutation(api.leases.create,listing);
  await t.run(async ctx=>{await ctx.db.patch(id,{moveInDate:'2020-01-01',leaseEndDate:'2020-06-30'});});
  expect(await t.query(api.leases.get,{})).toEqual([]);
  await expect(t.withIdentity(identity('applicant')).mutation(api.workflow.request,{listingId:id,message:'Viewing?'})).rejects.toThrow('ended');
  await owner.mutation(api.workflow.publication,{listingId:id,published:false});
  await expect(owner.mutation(api.workflow.publication,{listingId:id,published:true})).rejects.toThrow('dates');
 });
});

test('approved handover dates cannot be silently changed by a listing edit',async()=>{
 const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));const id=await owner.mutation(api.leases.create,listing);
 const applicant=t.withIdentity(identity('applicant'));
 const applicationId=await applicant.mutation(api.workflow.request,{listingId:id,message:'I would like a takeover.'});
 await t.withIdentity(identity('landlord')).mutation(api.workflow.decide,{applicationId,decision:'approved',reason:''});
 await expect(owner.mutation(api.domain.write,{operation:'updatePlace',input:{placeId:id,updates:{availableFrom:'2027-02-01'}}})).rejects.toThrow('Resolve the active handover');
 expect((await t.query(api.leases.getById,{id}))?.moveInDate).toBe('2027-01-01');
});

test('legacy date-order mistakes stay visible for confirmation without accepting applications',async()=>{
 const t=convexTest(schema,modules);const owner=t.withIdentity(identity('owner'));const id=await owner.mutation(api.leases.create,listing);
 await t.run(async ctx=>{await ctx.db.patch(id,{moveInDate:'2027-09-01',leaseEndDate:'2027-06-30'});});
 const docs=await t.query(api.leases.get,{});expect(docs).toHaveLength(1);
 expect(availabilityState(mapConvexListingToAppListing(docs[0] as any),'en','2026-11-17').kind).toBe('confirm');
 await expect(t.withIdentity(identity('applicant')).mutation(api.workflow.request,{listingId:id,message:'Viewing?'})).rejects.toThrow('dates need updating');
});
