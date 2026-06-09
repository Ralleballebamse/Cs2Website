import express from "express";

const router = express.Router();

router.get("/steam/profile", async (req, res) => {
    const { steamid } = req.query;

    if (!steamid) return res.status(400).json({ error: "Missing steamid" });

    try {
        const steamRes = await fetch(
            `https://steamcommunity.com/profiles/${steamid}`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
        );

        const html = await steamRes.text();

        if (!steamRes.ok) {
            return res.status(steamRes.status).json({ error: "Could not load Steam profile" });
        }

        // ---- Name ----
        const nameTag = '<span class="actual_persona_name">';
        const nameTagIndex = html.indexOf(nameTag);
        const nameStart = nameTagIndex + nameTag.length;
        const nameEnd = html.indexOf("</span>", nameStart);

        // ---- Full Avatar (from img srcset) ----
        const srcsetTag = '<img srcset="';
        const srcsetTagIndex = html.indexOf(srcsetTag);
        const srcsetStart = srcsetTagIndex + srcsetTag.length;
        const srcsetEnd = html.indexOf('"', srcsetStart);

        if (nameTagIndex === -1 || nameEnd === -1 || srcsetTagIndex === -1 || srcsetEnd === -1) {
            return res.status(502).json({ error: "Steam profile did not include profile data" });
        }

        const name = html.substring(nameStart, nameEnd).trim();
        const avatar = html.substring(srcsetStart, srcsetEnd).split(" ")[0];

        res.json({ name, avatar });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

export default router;
