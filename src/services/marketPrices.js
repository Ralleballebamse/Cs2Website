export const MAX_PRICE_AGE_MS = 24 * 60 * 60 * 1000;
const REFRESH_AGE_MS = 20 * 60 * 60 * 1000;
const ACTIVE_MS = 7 * 24 * 60 * 60 * 1000;

export function createMarketPrices({ store, fetchImpl = (...args) => fetch(...args), now = Date.now,
    intervalMs = 1000, cooldownMs = 60000 } = {}) {
    const cache = new Map();
    const pending = new Set();
    let loaded = false;
    let initializing;
    let busy = false;
    let timer;
    let maintenance;
    let stopped = false;
    let nextAt = 0;
    let pausedUntil = 0;
    let failures = 0;
    let spacing = intervalMs;

    async function init() {
        if (loaded) return;
        if (initializing) return initializing;
        initializing = (async () => {
            for (const [name, entry] of await store.load()) cache.set(name, entry);
            loaded = true;
        })();
        try { await initializing; } finally { initializing = null; }
    }

    function fresh(entry) {
        const age = now() - entry?.updatedAt;
        return entry?.updatedAt != null && age >= 0 && age < MAX_PRICE_AGE_MS;
    }

    function schedule() {
        if (stopped || busy || timer || !pending.size) return;
        timer = setTimeout(() => { timer = null; void processNext(); }, Math.max(0, nextAt - now(), pausedUntil - now()));
        timer.unref?.();
    }

    function queueDue() {
        for (const [name, entry] of cache) {
            if (now() - entry.lastSeenAt < ACTIVE_MS &&
                (!entry.updatedAt || now() - entry.updatedAt >= REFRESH_AGE_MS)) pending.add(name);
        }
        schedule();
    }

    function startMaintenance() {
        if (!maintenance && !stopped) {
            maintenance = setInterval(queueDue, 60000);
            maintenance.unref?.();
        }
    }

    async function processNext() {
        busy = true;
        const name = pending.values().next().value;
        try {
            const params = new URLSearchParams({ appid: "730", currency: "3", market_hash_name: name });
            const response = await fetchImpl(`https://steamcommunity.com/market/priceoverview/?${params}`, {
                signal: AbortSignal.timeout(15000),
            });
            if (!response.ok) {
                const err = new Error(`Steam HTTP ${response.status}`);
                const retry = response.headers.get("retry-after");
                err.retryMs = Number(retry) > 0 ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - now()) || 0;
                throw err;
            }
            const data = await response.json();
            if (!data.success) throw new Error("Steam returned no valid price response");
            const previous = cache.get(name);
            const entry = { ...previous, price: typeof data.lowest_price === "string" ? data.lowest_price : null,
                updatedAt: now() };
            await store.save(name, entry);
            cache.set(name, entry);
            pending.delete(name);
            failures = 0;
        } catch (err) {
            failures = Math.min(failures + 1, 6);
            pausedUntil = now() + Math.max(cooldownMs * 2 ** (failures - 1), err.retryMs || 0);
            spacing = Math.min(60000, spacing * 2);
            pending.delete(name);
            pending.add(name);
            console.warn(`Steam price refresh paused: ${err.message}; retry after ${new Date(pausedUntil).toISOString()}`);
        } finally {
            nextAt = now() + spacing;
            busy = false;
            schedule();
        }
    }

    return {
        async warm() {
            await init();
            queueDue();
            startMaintenance();
        },
        async get(names) {
            await init();
            startMaintenance();
            const unique = [...new Set(names)];
            await store.touch(unique, now());
            const prices = Object.create(null);
            for (const name of unique) {
                const entry = { ...cache.get(name), lastSeenAt: now() };
                cache.set(name, entry);
                const valid = fresh(entry);
                if (!valid || now() - entry.updatedAt >= REFRESH_AGE_MS) pending.add(name);
                prices[name] = {
                    price: valid ? entry.price : null,
                    updatedAt: valid ? entry.updatedAt : null,
                    expiresAt: valid ? entry.updatedAt + MAX_PRICE_AGE_MS : null,
                    status: valid ? (entry.price ? "fresh" : "unavailable") : pausedUntil > now() ? "paused" : "pending",
                    source: "Steam Community Market (EUR lowest listing)",
                };
            }
            schedule();
            return { prices, retryAfterMs: Object.values(prices).some(p => p.status === "pending" || p.status === "paused") ? 2000 : 60000 };
        },
        close() { stopped = true; clearTimeout(timer); clearInterval(maintenance); },
    };
}
