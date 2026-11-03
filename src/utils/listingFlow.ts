export function knownMonthlyCost(l: {
  monthlyRentPLN: number;
  czynszAdminPLN?: number;
  billsMode?: string;
  fixedBillsPLN?: number;
}) {
  return l.monthlyRentPLN + (l.czynszAdminPLN || 0) + (l.billsMode === "fixed" ? l.fixedBillsPLN || 0 : 0);
}
export function normalizeLandlordPhone(value: string = "") {
  const digits = value.trim().replace(/[()\s-]/g, "").replace(/^00/, "+");
  return /^\d{9}$/.test(digits) ? "+48" + digits : digits;
}
export function billsLabel(mode: string | undefined, fixed: number | undefined, locale: string) {
  const pl = locale === "pl";
  if (mode === "included") return pl ? "Media w cenie" : "Bills included";
  if (mode === "usage") return pl ? "Media według zużycia" : "Bills charged by usage";
  if (mode === "fixed") return pl ? `Media: ${fixed} PLN miesięcznie` : `Bills: PLN ${fixed} per month`;
  return pl ? "Media do ustalenia" : "Bills to confirm";
}
export function invalidListingStep(d: any): number | null {
  if (!d.district?.trim() || !d.address?.trim()) return 1;
  if (
    !d.squareMeters ||
    !Number.isFinite(Number(d.squareMeters)) ||
    Number(d.squareMeters) <= 0
  )
    return 2;
  if (
    !d.monthlyRentPLN ||
    Number(d.monthlyRentPLN) <= 0 ||
    Number(d.monthlyRentPLN) > 100000 ||
    d.czynszAdminPLN === "" ||
    !Number.isFinite(Number(d.czynszAdminPLN)) ||
    Number(d.czynszAdminPLN) < 0 ||
    (d.billsMode === "fixed" && (!Number.isFinite(Number(d.fixedBillsPLN)) || Number(d.fixedBillsPLN) <= 0)) ||
    d.depositPLN === "" ||
    Number(d.depositPLN) < 0 ||
    Number(d.depositPLN) > 1000000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(d.availableDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(d.leaseEndDate) ||
    !Number.isFinite(Date.parse(d.availableDate)) ||
    !Number.isFinite(Date.parse(d.leaseEndDate)) ||
    d.leaseEndDate < d.availableDate
  )
    return 3;
  if (!d.photos?.length || !/^\+[1-9]\d{7,14}$/.test(normalizeLandlordPhone(d.landlordPhone)))
    return 4;
  return null;
}
export async function draftStore(
  mode: "read" | "write" | "delete",
  key: string,
  value?: any,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("relok8-flow-drafts", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("listings");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(
        "listings",
        mode === "read" ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("listings");
      const req =
        mode === "read"
          ? store.get(key)
          : mode === "write"
            ? store.put(value, key)
            : store.delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve(mode === "read" ? req.result : undefined);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
