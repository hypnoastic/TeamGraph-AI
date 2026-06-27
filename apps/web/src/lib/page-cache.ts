const cache = new Map<string, unknown>();

export function getPageCache<T>(key: string): T | null {
  return (cache.get(key) as T | undefined) ?? null;
}

export function setPageCache<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function hasPageCache(key: string): boolean {
  return cache.has(key);
}
