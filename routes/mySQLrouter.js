import express from "express";
import { pool } from "../services/database.js";




const router = express.Router();


router.post("/marketId/get", async (req, res) => {
    try {
        const { weapon, name, condition, stattrak, souvenir } = req.body;

        const [rows] = await pool.execute(
            `SELECT marketID
            FROM items
            WHERE weapon = ?
            AND name = ?
            AND condition_name = ?
            AND is_stattrak = ?
            AND is_souvenir = ?
            LIMIT 1`,
            [weapon, name, condition, stattrak ? 1 : 0, souvenir ? 1 : 0]
        );

        res.json(rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

router.post("/marketId/set", async (req, res) => {
    try {
        const { marketID, weapon, name, condition, stattrak, souvenir } = req.body;

        await pool.execute(
            `INSERT INTO items (marketID, weapon, name, condition_name, is_stattrak, is_souvenir)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [marketID, weapon, name, condition, stattrak ? 1 : 0, souvenir ? 1 : 0]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

export default router;
