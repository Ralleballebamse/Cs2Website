import express from "express";
const router = express.Router();

// NEW: lowest price as plain text
router.get("/api/steam/lowest", async (req, res) => {
  const appid = req.query.appid || "730";
  const currency = req.query.currency || "3";
  const name = req.query.name;

  res.set("Content-Type", "text/plain; charset=utf-8");
  if (!name) return res.status(400).send("Undefined");

  const url =
    `https://steamcommunity.com/market/priceoverview` +
    `?appid=${appid}&currency=${currency}&market_hash_name=${encodeURIComponent(name)}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://steamcommunity.com/market/",
      },
    });

    if (!r.ok) return res.status(r.status).send("Undefined");

    const data = await r.json();
    return res.send(data?.lowest_price || "Undefined");
  } catch (err) {
    return res.status(500).send("Undefined");
  }
});

export default router;