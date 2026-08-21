/**
 * One-time migration: copies a value stored under an old localStorage key to a
 * new key, then removes the old key. No-op on the server; if the new key
 * already holds data, the old value is dropped (new key wins).
 */
export function migrateKey(oldKey: string, newKey: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(newKey) !== null) return;
  const old = localStorage.getItem(oldKey);
  if (old === null) return;
  localStorage.setItem(newKey, old);
  localStorage.removeItem(oldKey);
}
