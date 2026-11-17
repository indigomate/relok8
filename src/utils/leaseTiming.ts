export type OccupancyStatus = 'occupied' | 'vacant';
export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function todayInPoland(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}
export function validLeaseDates(start: unknown, end: unknown) {
  return isDateOnly(start) && isDateOnly(end) && end > start;
}
export function leaseHasEnded(end: string, today = todayInPoland()) {
  return !isDateOnly(end) || end < today;
}
export function matchesMoveInDate(start: string, end: string, target: string) {
  return validLeaseDates(start, end) && isDateOnly(target) && start <= target && target < end;
}
export function timingLabels(occupancy: OccupancyStatus | undefined, locale = 'en') {
  const pl = locale === 'pl';
  return {
    occupancy: occupancy === 'occupied' ? (pl ? 'Zamieszkane · najemca szuka następcy' : 'Occupied · tenant seeking a replacement') : occupancy === 'vacant' ? (pl ? 'Wolne · według autora ogłoszenia' : 'Vacant · reported by listing author') : (pl ? 'Stan zamieszkania: potwierdź z najemcą' : 'Occupancy: confirm with tenant'),
    date: occupancy === 'occupied' ? (pl ? 'Proponowana data przejęcia' : 'Proposed takeover date') : occupancy === 'vacant' ? (pl ? 'Najwcześniejsze wprowadzenie' : 'Earliest move-in date') : (pl ? 'Data przejęcia podana przez autora' : 'Advertised takeover date'),
    end: pl ? 'Koniec obecnej umowy najmu' : 'Current lease ends',
    notice: pl ? 'Datę przekazania i warunki trzeba uzgodnić z najemcą i właścicielem. Koniec umowy nie oznacza automatycznej wyprowadzki.' : 'Agree handover timing and terms with the tenant and landlord. The lease end date does not confirm that the home will be vacant.',
  };
}

export function availabilityState(listing: {occupancyStatus?: OccupancyStatus; availableDate: string; leaseEndDate: string; publicationStatus?: string}, locale = 'en', today = todayInPoland()) {
  const pl = locale === 'pl';
  if (!validLeaseDates(listing.availableDate, listing.leaseEndDate)) return {kind: 'confirm', title: pl ? 'Potwierdź termin przejęcia' : 'Confirm takeover timing', description: pl ? 'Daty wymagają aktualizacji' : 'Listing dates need updating'};
  if (leaseHasEnded(listing.leaseEndDate, today)) return {kind: 'ended', title: pl ? 'Umowa zakończona' : 'Lease ended', description: pl ? 'Zapytaj o aktualne warunki' : 'Ask for updated terms'};
  if (listing.publicationStatus === 'PAUSED') return {kind: 'paused', title: pl ? 'Ogłoszenie wstrzymane' : 'Listing paused', description: pl ? 'Nie przyjmuje nowych wniosków' : 'Not accepting new applications'};
  if (['APPROVED', 'TRANSFERRED', 'LEASED'].includes(listing.publicationStatus || '')) return {kind: 'taken', title: pl ? 'Następca wybrany' : 'Replacement found', description: pl ? 'Ogłoszenie nie jest otwarte' : 'This listing is no longer open'};
  if (['PENDING_HOLD', 'RESERVED_PENDING'].includes(listing.publicationStatus || '')) return {kind: 'held', title: pl ? 'Tymczasowo zarezerwowane' : 'Temporarily held', description: pl ? 'Sprawdź aktualny status z najemcą' : 'Check the current status with the tenant'};
  if (listing.occupancyStatus === 'vacant') return listing.availableDate <= today
    ? {kind: 'now', title: pl ? 'Dostępne teraz' : 'Available now', description: pl ? 'Wolne · uzgodnij przekazanie' : 'Vacant · agree your handover'}
    : {kind: 'upcoming', title: pl ? 'Dostępne od' : 'Available from', description: pl ? 'Wolne · przyszła data wprowadzenia' : 'Vacant · future move-in date'};
  if (listing.occupancyStatus === 'occupied' && listing.availableDate > today) return {kind: 'upcoming', title: pl ? 'Nadchodzące przejęcie najmu' : 'Upcoming takeover', description: pl ? 'Najemca szuka następcy · termin proponowany' : 'Tenant seeking a replacement · proposed timing'};
  return {kind: 'confirm', title: pl ? 'Potwierdź termin przejęcia' : 'Confirm takeover timing', description: pl ? 'Zapytaj najemcę o aktualne zamieszkanie i termin' : 'Ask the tenant about occupancy and timing'};
}

export function canRequestTakeover(listing: {availableDate: string; leaseEndDate: string; publicationStatus?: string}, today = todayInPoland()) {
  return validLeaseDates(listing.availableDate, listing.leaseEndDate) && !leaseHasEnded(listing.leaseEndDate, today) && (!listing.publicationStatus || ['AVAILABLE','PENDING_HOLD','RESERVED_PENDING'].includes(listing.publicationStatus));
}
