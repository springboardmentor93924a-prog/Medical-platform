// First-expiry-first-out: when a medicine has several batches with usable stock,
// the one that expires soonest should be used or sold first.
// Returns the batchIds that should be used first. Medicines with only one usable batch need no hint.
export function useFirstIds(rows) {
  const byMedicine = new Map();
  rows.forEach((r) => {
    if (r.quantity > 0 && r.daysToExpiry >= 0) {
      const list = byMedicine.get(r.medicineId) ?? [];
      list.push(r);
      byMedicine.set(r.medicineId, list);
    }
  });
  const ids = new Set();
  byMedicine.forEach((list) => {
    if (list.length > 1) ids.add([...list].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0].batchId);
  });
  return ids;
}