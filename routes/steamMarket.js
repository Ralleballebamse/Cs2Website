import express from "express";

const router = express.Router();

router.get("/api/steam", async (req, res) => {
  const { item_nameid, currency } = req.query;

  const steamRes = await fetch(
    `https://steamcommunity.com/market/itemordershistogram?country=SE&language=english&currency=${currency}&item_nameid=${item_nameid}`
  );

  const data = await steamRes.json();
  res.json(data);
});

export default router;