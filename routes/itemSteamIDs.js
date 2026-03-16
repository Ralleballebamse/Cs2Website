import express from "express";

const router = express.Router();

function extractMarketIdFromHtml(html) {
    const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
    return match ? match[1] : null;
}

router.get("/market/id", async (req, res) => {
    try {
        const { itemName } = req.query;

        if (!itemName) {
            return res.status(400).json({ error: "Missing itemName" });
        }

        const steamUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(itemName)}`;

        const response = await fetch(steamUrl);

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Steam request failed"
            });
        }

        const html = await response.text();
        const marketID = extractMarketIdFromHtml(html);

        if (!marketID) {
            return res.status(404).json({ error: "marketID not found" });
        }

        console.log(marketID);
        res.json({ marketID });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch marketID" });
    }
});

export default router;