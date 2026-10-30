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
import type * as domain from "../domain.js";
import type * as favorites from "../favorites.js";
import type * as inquiries from "../inquiries.js";
import type * as leases from "../leases.js";
import type * as lib_auth from "../lib/auth.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as services from "../services.js";
import type * as subscribers from "../subscribers.js";
import type * as tasks from "../tasks.js";
import type * as uploads from "../uploads.js";
import type * as whatsapp from "../whatsapp.js";
import type * as workflow from "../workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiMessages: typeof aiMessages;
  domain: typeof domain;
  favorites: typeof favorites;
  inquiries: typeof inquiries;
  leases: typeof leases;
  "lib/auth": typeof lib_auth;
  payments: typeof payments;
  profiles: typeof profiles;
  services: typeof services;
  subscribers: typeof subscribers;
  tasks: typeof tasks;
  uploads: typeof uploads;
  whatsapp: typeof whatsapp;
  workflow: typeof workflow;
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
