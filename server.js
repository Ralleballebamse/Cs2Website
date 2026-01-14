import express from "express";

const app = express();

// Serve frontend files from /public
app.use(express.static("public"));

app.get("/steam", async (req, res) => {
    const steamid = req.query.steamid;
    const appid = req.query.appid || "730";
    const contextid = req.query.contextid || "2";
    const count = req.query.count || "1";
  if (!steamid) {
    return res.status(400).json({ error: "Missing steamid" });
  }

    const url = `https://steamcommunity.com/inventory/${steamid}/${appid}/${contextid}?count=${count}`;
  try {
        const r = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json,text/plain,*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": `https://steamcommunity.com/profiles/${steamid}/inventory/`,
            "Origin": "https://steamcommunity.com"
        }
    });

    const contentType = r.headers.get("content-type") || "";
    const text = await r.text();

    // DEBUG OUTPUT (very important)
    console.log("Steam status:", r.status);
    console.log("Steam content-type:", contentType);
    console.log("Steam body preview:", text.slice(0, 200));

    if (!r.ok) {
      return res.status(r.status).json({
        error: "Steam request failed",
        status: r.status,
        bodyPreview: text.slice(0, 200)
      });
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      res.status(502).json({
        error: "Steam did not return JSON",
        contentType,
        bodyPreview: text.slice(0, 200)
      });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);