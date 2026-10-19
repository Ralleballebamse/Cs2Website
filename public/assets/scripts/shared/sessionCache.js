const PREFIX = "skinscope:session:v1:";

export function createSessionCache({ storage, now = Date.now, maxEntries = 40 } = {}) {
    if (storage === undefined) {
        try { storage = globalThis.sessionStorage; } catch { storage = null; }
    }
    const memory = new Map();
    const inFlight = new Map();

    function remove(key) {
        memory.delete(key);
        try { storage?.removeItem(PREFIX + key); } catch { /* Storage may be disabled. */ }
    }

    function get(key) {
        let entry = memory.get(key);
        if (!entry) {
            try { entry = JSON.parse(storage?.getItem(PREFIX + key) || "null"); } catch { remove(key); }
        }
        if (!entry || !Number.isFinite(entry.expiresAt) || entry.expiresAt <= now()) {
            remove(key);
            return null;
        }
        memory.set(key, entry);
        return entry.data;
    }

    function set(key, data, ttl) {
        const entry = { data, expiresAt: now() + ttl, savedAt: now() };
        memory.set(key, entry);
        try {
            const entries = [];
            for (let i = 0; i < (storage?.length || 0); i++) {
                const fullKey = storage.key(i);
                if (fullKey?.startsWith(PREFIX)) entries.push(fullKey);
            }
            for (const fullKey of entries) {
                const cached = JSON.parse(storage.getItem(fullKey) || "null");
                if (!cached || cached.expiresAt <= now()) storage.removeItem(fullKey);
            }
            const candidates = entries.filter(fullKey => storage.getItem(fullKey) && fullKey !== PREFIX + key)
                .sort((a, b) => JSON.parse(storage.getItem(a)).savedAt - JSON.parse(storage.getItem(b)).savedAt);
            while (candidates.length >= maxEntries) remove(candidates.shift().slice(PREFIX.length));
            // Inventories can exhaust the quota. Evict only our cache entries and retry.
            while (true) {
                try { storage?.setItem(PREFIX + key, JSON.stringify(entry)); break; }
                catch { if (!candidates.length) break; remove(candidates.shift().slice(PREFIX.length)); }
            }
        } catch { /* Keep the in-memory result when storage is blocked/corrupt/full. */ }
        while (memory.size > maxEntries) memory.delete(memory.keys().next().value);
        return data;
    }

    async function load(key, ttl, loader, accept = () => true) {
        const cached = get(key);
        if (cached !== null) return cached;
        if (inFlight.has(key)) return inFlight.get(key);
        const task = Promise.resolve().then(loader).then(data => {
            if (accept(data)) set(key, data, ttl);
            return data;
        }).finally(() => inFlight.delete(key));
        inFlight.set(key, task);
        return task;
    }

    return { get, set, load };
}

export const steamSessionCache = createSessionCache();
