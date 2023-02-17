import LRU from 'cache-lru';

const byName = new LRU();
byName.limit(2000);

const byId = new LRU();
byId.limit(2000);

export const nameCache = byName;
export const ancestryIdCache = byId;
