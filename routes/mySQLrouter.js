import express from "express";
import mysql from "mysql2/promise";

const router = express.Router();

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "cs2dev",
    password: "cs2dev123",
    database: "cs2_website",
});

router.post("/price/get", async (req, res) => {
    try {
        const { weapon, name, condition, stattrak, souvenir } = req.body;

        const [rows] = await pool.execute(
            `SELECT i.id, p.price, p.updated_at
            FROM items i
            LEFT JOIN prices p ON p.item_id = i.id
            WHERE i.weapon = ?
            AND i.name = ?
            AND i.condition_name = ?
            AND i.is_stattrak = ?
            AND i.is_souvenir = ?
            LIMIT 1`,
            [weapon, name, condition, stattrak ? 1 : 0, souvenir ? 1 : 0]
        );

        res.json(rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

router.post("/price/set", async (req, res) => {
    try {
        const { weapon, name, condition, stattrak, souvenir, price } = req.body;

        const [itemResult] = await pool.execute(
            `INSERT INTO items (weapon, name, condition_name, is_stattrak, is_souvenir)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [weapon, name, condition, stattrak ? 1 : 0, souvenir ? 1 : 0]
        );

        const itemId = itemResult.insertId;

        await pool.execute(
            `INSERT INTO prices (item_id, price)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE price = VALUES(price)`,
            [itemId, price]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

router.post("/users/set", async (req, res) => {
    try {
        const { username, password_hash, steam_url } = req.body;

        await pool.execute(
            `INSERT INTO users (username, password_hash, steam_url)
            VALUES (?, ?, ?)`,
            [username, password_hash, steam_url]
        );

        res.json({ ok: true, created: true });
    } catch (err) {

        if (err.code === "ER_DUP_ENTRY") {
            return res.json({ ok: false, reason: "username_exists" });
        }

        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

router.post("/users/get", async (req, res) => {
    try {
        const { username, password_hash} = req.body;

        const [rows] = await pool.execute(
            `SELECT username, steam_url
            FROM users
            WHERE username = ?
            AND password_hash = ?`,
            [username, password_hash]
        );

        res.json(rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

export default router;