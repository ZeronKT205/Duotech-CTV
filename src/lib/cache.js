// In-memory cache with TTL (Time-to-Live) and pattern-based invalidation.
// This is suitable for caching database queries to improve performance.

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache.
   * @param {string} key 
   * @returns {*} value or null if not found or expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Set a value in the cache with a specific TTL (in seconds).
   * @param {string} key 
   * @param {*} value 
   * @param {number} ttlSeconds 
   */
  set(key, value, ttlSeconds = 60) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete a specific cache key.
   * @param {string} key 
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache keys matching a pattern.
   * For example: `invalidate('projects:*')` will clear keys like `projects:list`, `projects:stats`.
   * @param {string} pattern 
   */
  invalidate(pattern) {
    if (!pattern) return;
    
    // Convert wildcard pattern to RegExp (e.g. 'projects:*' -> /^projects:.*$/)
    const regexStr = '^' + pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries.
   */
  clear() {
    this.cache.clear();
  }
}

// Global cache object to survive hot reloading in development environment
if (!global.apiCache) {
  global.apiCache = new MemoryCache();
}

export const cache = global.apiCache;
