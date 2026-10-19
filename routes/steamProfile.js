import express from "express";
import { getSteamProfile } from "../services/steamProfiles.js";
const router = express.Router();

router.get("/steam/profile", async (req, res) => {
    const { steamid, url } = req.query;
    if (!url && (typeof steamid !== "string" || !/^\d{17}$/.test(steamid))) {
        return res.status(400).json({ error: "A Steam profile URL or Steam ID is required" });
    }
    try { res.json(await getSteamProfile(url || `https://steamcommunity.com/profiles/${steamid}`)); }
    catch (err) { res.status(err.status || 502).json({ error: err.message }); }
});
export default router;
