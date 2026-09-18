import { LANDMARKS, SITE } from './data.js?v=0123';
const validIds = new Set(LANDMARKS.map((item) => item.id));
export function cleanProgress(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.visited)) return { version: 1, visited: [] };
  return { version: 1, visited: [...new Set(value.visited.filter((id) => typeof id === 'string' && validIds.has(id)))] };
}
export function readProgress(storage) {
  try { return cleanProgress(JSON.parse(storage.getItem(SITE.storageKey))); }
  catch { return { version: 1, visited: [] }; }
}
export function writeProgress(storage, value) {
  try { storage.setItem(SITE.storageKey, JSON.stringify(cleanProgress(value))); return true; }
  catch { return false; }
}
export function addDiscovery(progress, id) {
  const next = cleanProgress(progress);
  if (validIds.has(id) && !next.visited.includes(id)) next.visited.push(id);
  return next;
}
