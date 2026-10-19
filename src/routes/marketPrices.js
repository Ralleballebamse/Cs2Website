import express from "express";
import { createMarketPrices } from "../services/marketPrices.js";
import { priceStore } from "../services/priceStore.js";

const router = express.Router();
const marketPrices = createMarketPrices({ store: priceStore });
export function startPriceMaintenance() {
    void marketPrices.warm().catch(err => console.error("Price database unavailable:", err.message));
}

router.post("/market/prices", async (req, res, next) => {
    const names = req.body?.names;
    if (!Array.isArray(names) || names.length > 500 ||
        names.some(name => typeof name !== "string" || !name.trim() || name.length > 256)) {
        return res.status(400).json({ error: "Provide up to 500 market item names" });
    }
    try {
        res.json(await marketPrices.get(names));
    } catch (err) {
        console.error("Price database unavailable:", err.message);
        res.status(503).json({ error: "Price database temporarily unavailable" });
    }
});

export default router;
