import test from "node:test";
import assert from "node:assert/strict";
import { createSessionCache } from "../../public/assets/scripts/shared/sessionCache.js";

function storageMock() {
    const data = new Map();
    return {
        get length() { return data.size; },
        key: index => [...data.keys()][index],
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: key => data.delete(key),
    };
}

test("a new page instance reuses session storage without fetching", async () => {
    const storage = storageMock();
    const first = createSessionCache({ storage });
    await first.load("profile:1", 10000, () => ({ name: "Player", avatar: "image" }));
    const reloaded = createSessionCache({ storage });
    const result = await reloaded.load("profile:1", 10000, () => assert.fail("Should not fetch on refresh"));
    assert.equal(result.name, "Player");
});

test("expiration triggers one fresh request shared by concurrent callers", async () => {
    let clock = 100;
    let calls = 0;
    const cache = createSessionCache({ storage: storageMock(), now: () => clock });
    cache.set("inventory:1", { value: "old" }, 10);
    clock = 110;
    const loader = async () => { calls++; return { value: "new" }; };
    const results = await Promise.all([cache.load("inventory:1", 10, loader), cache.load("inventory:1", 10, loader)]);
    assert.equal(calls, 1);
    assert.equal(results[0].value, "new");
});

test("429 and other rejected results are never cached", async () => {
    const cache = createSessionCache({ storage: storageMock() });
    let calls = 0;
    const loader = () => { calls++; return { status: 429 }; };
    for (let i = 0; i < 2; i++) await cache.load("inventory:1", 10000, loader, data => data.status !== 429);
    assert.equal(calls, 2);
    assert.equal(cache.get("inventory:1"), null);
});

test("storage blocked or full still supports memory caching", async () => {
    const storage = { get length() { throw new Error("Denied"); }, getItem() { throw new Error("Denied"); } };
    const cache = createSessionCache({ storage });
    cache.set("profile:1", { name: "Player" }, 1000);
    assert.equal(cache.get("profile:1").name, "Player");
});

test("bounded eviction preserves unrelated session storage", () => {
    const storage = storageMock();
    storage.setItem("unrelated", "keep");
    const cache = createSessionCache({ storage, maxEntries: 2 });
    cache.set("profile:1", { name: "one" }, 1000);
    cache.set("profile:2", { name: "two" }, 1000);
    cache.set("profile:3", { name: "three" }, 1000);
    assert.equal(cache.get("profile:1"), null);
    assert.equal(cache.get("profile:3").name, "three");
    assert.equal(storage.getItem("unrelated"), "keep");
});

test("new match data does not overwrite reusable player details", async () => {
    const cache = createSessionCache({ storage: storageMock() });
    cache.set("match:old", { steamIds: ["1"] }, 1000);
    cache.set("profile:1", { name: "Player" }, 1000);
    await cache.load("match:new", 1000, () => ({ steamIds: ["1", "2"] }));
    assert.deepEqual(cache.get("match:new").steamIds, ["1", "2"]);
    assert.equal(cache.get("profile:1").name, "Player");
});
