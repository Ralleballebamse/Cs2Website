import express from "express";

const router = express.Router();

router.get("/price", async (req, res) => {
  const appid = req.query.appid || "730";
  const currency = req.query.currency || "3";
  const name = req.query.name;

  if (!name) return res.status(400).json({ error: "Missing name" });

  const url =
    `https://steamcommunity.com/market/priceoverview/` +
    `?appid=${appid}&currency=${currency}&market_hash_name=${encodeURIComponent(name)}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://steamcommunity.com/market/"
      }
    });

    const text = await r.text();
    res.status(r.status).send(text); // pass through Steam response
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;