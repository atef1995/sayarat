class DbCache<T> {
  private cache: Map<string, T>;

  constructor() {
    this.cache = new Map();
  }

  // Get an item from the cache
  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  // Set an item in the cache
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  // Clear the cache
  clear(): void {
    this.cache.clear();
  }
}

export default DbCache;
