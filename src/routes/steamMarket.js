import express from "express";
const router = express.Router();

router.get("/market/price", async (req, res) => {
    try {
        const { marketID, currency = "€" } = req.query;

        if (!marketID) {
            return res.status(400).json({ error: "Missing marketID" });
        }

        const currencyCode = currency === "€" ? 3 : 1;

        const url =
            `https://steamcommunity.com/market/itemordershistogram` +
            `?country=SE&language=english&currency=${currencyCode}&item_nameid=${marketID}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Steam price request failed"
            });
        }

        const data = await response.json();

        let price = null;

        if (data?.sell_order_table) {
            if (currency === "€") {
                const parts = data.sell_order_table.split("€")[0].split(">");
                price = parts[parts.length - 1]?.trim() + "€";
                if (price.includes(",--")) {
                    console.log(price);

                    let secondParts = price.split(",");
                    price = secondParts[0] + "€";
                }
                console.log(price);
                console.log("1");
            } else {
                price = "$" + data.sell_order_table.split("$")[1]?.split("<")[0]?.trim();
            }
        }

        res.json({
            marketID,
            currency,
            price,
            raw: data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch price" });
    }
});

export default router;