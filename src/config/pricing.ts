export const RELOK8_LAUNCH_PRICING = Object.freeze({
  currency: 'PLN' as const,
  tenantReservationConfirmationPLN: 49,
  tenantReservationConfirmationGrosze: 4_900,
  landlordActiveTenancyMonthlyPLN: 49,
  landlordActiveTenancyMonthlyGrosze: 4_900,
  scenarioAveragePaidMonths: 10,
  scenarioVatRate: 0.23,
  scenarioPlnPerEuro: 4.3,
});

export function grossBilledPerTenancyPLN(
  paidLandlordMonths = RELOK8_LAUNCH_PRICING.scenarioAveragePaidMonths,
) {
  if (!Number.isInteger(paidLandlordMonths) || paidLandlordMonths < 0) {
    throw new Error('Paid landlord months must be a non-negative integer');
  }
  return RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN
    + RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN * paidLandlordMonths;
}

export function illustrativeNetRevenueEUR(
  paidLandlordMonths = RELOK8_LAUNCH_PRICING.scenarioAveragePaidMonths,
) {
  const netPLN = grossBilledPerTenancyPLN(paidLandlordMonths)
    / (1 + RELOK8_LAUNCH_PRICING.scenarioVatRate);
  return netPLN / RELOK8_LAUNCH_PRICING.scenarioPlnPerEuro;
}

