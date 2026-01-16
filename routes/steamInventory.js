import express from "express";

const router = express.Router();

router.get("/steam", async (req, res) => {
  const steamid = req.query.steamid;
  const appid = req.query.appid || "730";
  const contextid = req.query.contextid || "2";
  const count = req.query.count || "2000";

  if (!steamid) return res.status(400).json({ error: "Missing steamid" });

  const url = `https://steamcommunity.com/inventory/${steamid}/${appid}/${contextid}?count=${count}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `https://steamcommunity.com/profiles/${steamid}/inventory/`,
        "Origin": "https://steamcommunity.com"
      }
    });

    const text = await r.text();
    res.status(r.status).send(text); // pass through Steam response
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;