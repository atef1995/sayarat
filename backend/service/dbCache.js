class DbCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Retrieves a value from the cache.
   * @param {string} key - The key to look up in the cache.
   * @returns {*} The cached value or undefined if not found.
   */
  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = { DbCache };
