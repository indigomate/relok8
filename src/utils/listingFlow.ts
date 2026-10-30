export function knownMonthlyCost(l: {
  monthlyRentPLN: number;
  czynszAdminPLN?: number;
}) {
  return l.monthlyRentPLN + (l.czynszAdminPLN || 0);
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
  if (!d.photos?.length || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.landlordEmail))
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
