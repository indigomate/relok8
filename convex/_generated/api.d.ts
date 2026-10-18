/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiMessages from "../aiMessages.js";
import type * as favorites from "../favorites.js";
import type * as inquiries from "../inquiries.js";
import type * as leases from "../leases.js";
import type * as listings from "../listings.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as tasks from "../tasks.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiMessages: typeof aiMessages;
  favorites: typeof favorites;
  inquiries: typeof inquiries;
  leases: typeof leases;
  listings: typeof listings;
  payments: typeof payments;
  profiles: typeof profiles;
  tasks: typeof tasks;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
