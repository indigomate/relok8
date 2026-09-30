export interface ListingTypeDefinition {
  type: string;
  name: string;
  priceUnit: string;
  priceUnitShort: string;
  routePrefix: string;
  enabled: boolean;
  depositLabel: string;
  handoverLabel: string;
}

export const LISTING_TYPE_REGISTRY: Record<string, ListingTypeDefinition> = {
  lease_takeover: {
    type: 'lease_takeover',
    name: 'Lease takeover',
    priceUnit: 'PLN / month',
    priceUnitShort: '/mo',
    routePrefix: 'rooms',
    enabled: true,
    depositLabel: 'Deposit',
    handoverLabel: 'Lease takeover'
  },
  hosting: {
    type: 'hosting',
    name: 'Hosting',
    priceUnit: 'PLN / night',
    priceUnitShort: '/night',
    routePrefix: 'stays',
    enabled: false, // Behind feature flag - not visible anywhere until enabled
    depositLabel: 'Security deposit',
    handoverLabel: 'Host booking'
  }
};

export const DEFAULT_LISTING_TYPE = LISTING_TYPE_REGISTRY.lease_takeover;
