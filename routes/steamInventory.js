import express from "express";

const router = express.Router();
const inventoryCache = new Map();
const inFlightRequests = new Map();
const CACHE_MS = 5 * 60 * 1000;
const STALE_CACHE_MS = 30 * 60 * 1000;

function sendCachedInventory(res, cached, cacheStatus = "HIT") {
  res
    .status(cached.status)
    .set("Content-Type", cached.contentType)
    .set("X-Inventory-Cache", cacheStatus)
    .send(cached.text);
}

router.get("/steam", async (req, res) => {
  const steamid = req.query.steamid;
  const appid = req.query.appid || "730";
  const contextid = req.query.contextid || "2";
  const count = req.query.count || "2000";

  if (!steamid) return res.status(400).json({ error: "Missing steamid" });

  const cacheKey = `${steamid}:${appid}:${contextid}:${count}`;
  const cached = inventoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.createdAt < CACHE_MS) {
    return sendCachedInventory(res, cached);
  }

  if (inFlightRequests.has(cacheKey)) {
    try {
      const result = await inFlightRequests.get(cacheKey);
      return sendCachedInventory(res, result, "IN_FLIGHT");
    } catch (err) {
      if (cached && now - cached.createdAt < STALE_CACHE_MS) {
        return sendCachedInventory(res, cached, "STALE");
      }

      return res.status(500).json({ error: String(err) });
    }
  }

  const url = `https://steamcommunity.com/inventory/${steamid}/${appid}/${contextid}?count=${count}`;

  const requestPromise = (async () => {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `https://steamcommunity.com/profiles/${steamid}/inventory/`,
        "Origin": "https://steamcommunity.com"
      }
    });

    let text = await r.text();
    let contentType = r.headers.get("content-type") || "application/json";

    if ((r.status === 401 || r.status === 403) && !contentType.includes("application/json")) {
      text = JSON.stringify({ error: "This inventory is private or unavailable" });
      contentType = "application/json";
    }

    if (r.status === 429 && !contentType.includes("application/json")) {
      text = JSON.stringify({ error: "Steam is rate limiting inventory requests" });
      contentType = "application/json";
    }

    const result = {
      status: r.status,
      text,
      contentType,
      createdAt: Date.now()
    };

    if (r.ok || r.status === 401 || r.status === 403) {
      inventoryCache.set(cacheKey, result);
    }

    return result;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;

    if (result.status === 429 && cached && now - cached.createdAt < STALE_CACHE_MS) {
      return sendCachedInventory(res, cached, "STALE");
    }

    res
      .status(result.status)
      .set("Content-Type", result.contentType)
      .set("X-Inventory-Cache", "MISS")
      .send(result.text);
  } catch (err) {
    if (cached && now - cached.createdAt < STALE_CACHE_MS) {
      return sendCachedInventory(res, cached, "STALE");
    }

    res.status(500).json({ error: String(err) });
  } finally {
    inFlightRequests.delete(cacheKey);
  }
});

export default router;
