import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const saltRounds = 10;

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

router.post("/price/set", async (req, res) => {
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

router.post("/users/set", async (req, res) => {
    try {
        const { username, password, steam_url } = req.body;

        const password_hash = await hashPassword(password);

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
        const { username, password } = req.body;

        const [rows] = await pool.execute(
            `SELECT username, password_hash, steam_url
            FROM users
            WHERE username = ?`,
            [username]
        );

        const storedHash = rows[0].password_hash;
        const steam_url = rows[0].steam_url;

        const checkedPassword = await checkPassword(password, storedHash)

        if (!checkedPassword) {
            return res.json(false);
        } else {
            return res.json({ checkedPassword, steam_url });
        }
    } catch (err) {
        return res.json(false);
    }
});

async function hashPassword(password) {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

async function checkPassword(enteredPassword, storedHash) {
    return await bcrypt.compare(enteredPassword, storedHash);
}

export default router;