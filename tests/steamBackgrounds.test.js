import test from "node:test";
import assert from "node:assert/strict";
import { createSteamBackgrounds } from "../services/steamBackgrounds.js";

const id = "76561198147725430";
test("returns equipped image/video URLs and shares cached requests", async () => {
    let calls = 0;
    const service = createSteamBackgrounds({ fetchImpl: async () => {
        calls++;
        return Response.json({ response: { profile_background: {
            image_large: "items/123/image.jpg", movie_webm: "items/123/video.webm", movie_mp4: "items/123/video.mp4", item_title: "Background",
        } } });
    } });
    const [a, b] = await Promise.all([service.get(id), service.get(id)]);
    assert.equal(calls, 1);
    assert.equal(a.background.image, "https://shared.fastly.steamstatic.com/community_assets/images/items/123/image.jpg");
    assert.ok(b.background.webm.endsWith("video.webm"));
    await service.get(id);
    assert.equal(calls, 1);
});

test("missing backgrounds use a cached null result", async () => {
    let calls = 0;
    const service = createSteamBackgrounds({ fetchImpl: async () => { calls++; return Response.json({ response: {} }); } });
    assert.equal((await service.get(id)).background, null);
    await service.get(id);
    assert.equal(calls, 1);
});

test("rejects invalid IDs and unsafe media paths", async () => {
    let calls = 0;
    const service = createSteamBackgrounds({ fetchImpl: async () => {
        calls++;
        return Response.json({ response: { profile_background: { image_large: "https://example.com/image.jpg", movie_mp4: "items/1/../movie.mp4" } } });
    } });
    await assert.rejects(service.get("invalid"), /Invalid Steam ID/);
    assert.equal(calls, 0);
    assert.equal((await service.get(id)).background, null);
});

test("refreshes after one hour and retries failed fetches", async () => {
    let clock = 1000;
    let calls = 0;
    const service = createSteamBackgrounds({ now: () => clock, fetchImpl: async () => {
        calls++;
        return calls === 1 ? new Response("", { status: 429 }) : Response.json({ response: {} });
    } });
    await assert.rejects(service.get(id));
    await service.get(id);
    clock += 3600000;
    await service.get(id);
    assert.equal(calls, 3);
});
