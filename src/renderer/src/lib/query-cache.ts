/**
 * query-cache.ts
 *
 * A lightweight, in-memory TTL read cache.
 * - Keyed by arbitrary strings.
 * - Entries expire after a configurable TTL (default 30 s).
 * - Supports explicit invalidation for when a write must bust the cache.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// ─── Internal Store ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>()

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve a cached value.
 * Returns `null` if the key doesn't exist or has expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

/**
 * Store a value in the cache with a TTL.
 * @param key      Cache key (e.g. `gamification_<userId>`)
 * @param data     The value to cache
 * @param ttlMs    Time-to-live in milliseconds (default: 30 000 ms)
 */
export function setCached<T>(key: string, data: T, ttlMs = 30_000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

/**
 * Explicitly remove a single key from the cache.
 * Call this after a write that changes the cached data.
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache entries whose key starts with a given prefix.
 * E.g. `invalidateCacheByPrefix('gamification_')` clears all users' gamification caches.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Clear the entire cache (useful on logout).
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Returns how many entries are currently cached (for debugging).
 */
export function cacheSize(): number {
  return cache.size
}
