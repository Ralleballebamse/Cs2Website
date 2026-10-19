import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { createMarketPrices, MAX_PRICE_AGE_MS } from "../../src/services/marketPrices.js";

function fixture(t, entries = [], options = {}) {
    const rows = new Map(entries);
    const store = {
        async load() { return [...rows]; },
        async touch(names, time) { for (const name of names) rows.set(name, { ...rows.get(name), lastSeenAt: time }); },
        async save(name, entry) { rows.set(name, { ...entry }); },
    };
    const service = createMarketPrices({ store, intervalMs: 1, ...options });
    t.after(() => service.close());
    return { service, rows, store };
}

async function until(check) {
    for (let i = 0; i < 100; i++) { if (await check()) return; await delay(5); }
    assert.fail("Queue did not finish");
}

test("fresh database prices return immediately without contacting Steam", async t => {
    const clock = 1000000000;
    const { service } = fixture(t, [["Skin", { price: "1,23€", updatedAt: clock - 3600000, lastSeenAt: clock }]],
        { now: () => clock, fetchImpl: () => assert.fail("Should use DB price") });
    const result = (await service.get(["Skin"])).prices.Skin;
    assert.equal(result.price, "1,23€");
    assert.equal(result.expiresAt, clock - 3600000 + MAX_PRICE_AGE_MS);
});

test("strictly rejects prices at or beyond 24 hours and future timestamps", async t => {
    const clock = 1000000000;
    const entries = [["Expired", clock - MAX_PRICE_AGE_MS], ["Older", clock - MAX_PRICE_AGE_MS - 1], ["Future", clock + 1]]
        .map(([name, updatedAt]) => [name, { price: "9,99€", updatedAt, lastSeenAt: clock }]);
    const { service } = fixture(t, entries, { now: () => clock });
    service.close();
    const { prices } = await service.get(entries.map(([name]) => name));
    for (const result of Object.values(prices)) { assert.equal(result.price, null); assert.equal(result.updatedAt, null); }
});

test("deduplicates concurrent requests, saves live EUR price, and reuses it after restart", async t => {
    let calls = 0;
    const { service, store, rows } = fixture(t, [], { fetchImpl: async url => {
        calls++;
        assert.equal(new URL(url).searchParams.get("market_hash_name"), "StatTrak™ Skin");
        assert.equal(new URL(url).searchParams.get("currency"), "3");
        return Response.json({ success: true, lowest_price: "2,34€" });
    } });
    await Promise.all([service.get(["StatTrak™ Skin"]), service.get(["StatTrak™ Skin"])]);
    await until(() => rows.get("StatTrak™ Skin")?.price);
    assert.equal(calls, 1);
    const restarted = createMarketPrices({ store, fetchImpl: () => assert.fail("Must use DB") });
    t.after(() => restarted.close());
    assert.equal((await restarted.get(["StatTrak™ Skin"])).prices["StatTrak™ Skin"].price, "2,34€");
});

test("proactive refresh runs at 20h without a page request", async t => {
    const clock = 1000000000;
    let calls = 0;
    const { service, rows } = fixture(t, [["Skin", { price: "1€", updatedAt: clock - 21 * 3600000, lastSeenAt: clock }]],
        { now: () => clock, fetchImpl: async () => { calls++; return Response.json({ success: true, lowest_price: "2€" }); } });
    await service.warm();
    await until(() => rows.get("Skin").price === "2€");
    assert.equal(calls, 1);
    assert.equal(rows.get("Skin").updatedAt, clock);
});

test("failed refresh never renews an expired timestamp and pauses requests", async t => {
    let calls = 0;
    const updatedAt = Date.now() - MAX_PRICE_AGE_MS - 1000;
    const { service, rows } = fixture(t, [["Skin", { price: "99€", updatedAt, lastSeenAt: Date.now() }]], {
        fetchImpl: async () => { calls++; return new Response("", { status: 429, headers: { "Retry-After": "120" } }); },
    });
    await service.get(["Skin"]);
    await until(() => calls === 1);
    await delay(10);
    const result = (await service.get(["Skin"])).prices.Skin;
    assert.equal(result.price, null);
    assert.equal(result.status, "paused");
    assert.equal(rows.get("Skin").updatedAt, updatedAt);
    assert.equal(calls, 1);
});
