import LRU from "cache-lru";

const cache = new LRU();

cache.limit(2000);

export default cache;
