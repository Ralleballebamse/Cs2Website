import test from "node:test";
import assert from "node:assert/strict";
import { getSteamProfile, parseSteamProfileUrl } from "../../src/services/steamProfiles.js";
import { buildInventoryRoster } from "../../public/assets/scripts/inventory/inventoryRoster.js";

test("validates Steam profile URLs without allowing other hosts or credentials", () => {
    for (const url of ["https://steamcommunity.com/id/player", "https://steamcommunity.com/profiles/76561197960287930"]) assert.ok(parseSteamProfileUrl(url));
    for (const url of [undefined, 12, "https://example.com/id/player", "https://steamcommunity.com.evil.com/id/player", "https://user@steamcommunity.com/id/player", "https://steamcommunity.com/market", "http://steamcommunity.com/id/player"]) assert.equal(parseSteamProfileUrl(url), null);
});

test("resolves custom profile URLs to Steam IDs and caches duplicate requests", async t => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
        calls++;
        return new Response('<profile><steamID64>76561198000000001</steamID64><steamID><![CDATA[Player & name]]></steamID><avatarFull><![CDATA[https://avatars.steamstatic.com/test.jpg]]></avatarFull></profile>');
    };
    t.after(() => { globalThis.fetch = original; });
    const [a, b] = await Promise.all([getSteamProfile("https://steamcommunity.com/id/test-profile"), getSteamProfile("https://steamcommunity.com/id/test-profile")]);
    assert.equal(a.steamid, "76561198000000001");
    assert.equal(a.name, "Player & name");
    assert.equal(b.avatar, "https://avatars.steamstatic.com/test.jpg");
    await getSteamProfile("https://steamcommunity.com/profiles/76561198000000001");
    assert.equal(calls, 1);
});

test("invalid profiles and failed lookups are not cached as successful profiles", async t => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response("<response><error>Not found</error></response>"); };
    t.after(() => { globalThis.fetch = original; });
    for (let i = 0; i < 2; i++) await assert.rejects(getSteamProfile("https://steamcommunity.com/id/missing-profile"), /not found/);
    assert.equal(calls, 2);
});

test("own inventory appears without a match and is deduplicated across new matches", () => {
    const own = "76561198000000001";
    const other = "76561198000000002";
    assert.deepEqual(buildInventoryRoster(own, []), [own]);
    assert.deepEqual(buildInventoryRoster(own, [other, own, other]), [own, other]);
    assert.deepEqual(buildInventoryRoster(own, ["76561198000000003"]), [own, "76561198000000003"]);
    assert.deepEqual(buildInventoryRoster(null, [other]), [other]);
});
