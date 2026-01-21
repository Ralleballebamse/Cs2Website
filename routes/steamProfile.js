import express from "express";

const router = express.Router();

router.get("/steam/profile", async (req, res) => {
    const { steamid } = req.query;

    const steamRes = await fetch(
        `https://steamcommunity.com/profiles/${steamid}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const html = await steamRes.text();

    // ---- Name ----
    const nameTag = '<span class="actual_persona_name">';
    const nameStart = html.indexOf(nameTag) + nameTag.length;
    const nameEnd = html.indexOf("</span>", nameStart);
    const name = html.substring(nameStart, nameEnd).trim();

    // ---- Full Avatar (from img srcset) ----
    const srcsetTag = 'srcset="';
    const srcsetStart = html.indexOf(srcsetTag) + srcsetTag.length;
    const srcsetEnd = html.indexOf('"', srcsetStart);
    const avatar = html.substring(srcsetStart, srcsetEnd);

    res.json({ name, avatar });
});

export default router;