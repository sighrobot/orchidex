import LRU from "cache-lru";

export const cache = new LRU().limit(2000);
