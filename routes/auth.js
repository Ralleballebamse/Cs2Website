import express from "express";
import bcrypt from "bcrypt";
import { randomBytes, createHash } from "node:crypto";
import { pool } from "../services/database.js";
import { parseSteamProfileUrl } from "../services/steamProfiles.js";

const COOKIE = "skinscope_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const hash = token => createHash("sha256").update(token).digest("hex");
const tokenFrom = req => req.headers.cookie?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);

export function createAuthRouter(db = pool) {
    const router = express.Router();
    let ready;
    const attempts = new Map();
    function init() {
        if (!ready) ready = db.query(`CREATE TABLE IF NOT EXISTS user_sessions (
            token_hash CHAR(64) PRIMARY KEY,
            user_id INT NOT NULL,
            expires_at BIGINT NOT NULL,
            INDEX (expires_at), INDEX (user_id)
        )`).catch(err => { ready = null; throw err; });
        return ready;
    }
    function setCookie(req, res, token, maxAge) {
        res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: req.secure,
            path: "/", maxAge });
    }
    async function issue(req, res, user) {
        await init();
        const old = tokenFrom(req);
        if (old) await db.execute("DELETE FROM user_sessions WHERE token_hash = ?", [hash(old)]);
        const token = randomBytes(32).toString("hex");
        await db.execute("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            [hash(token), user.id, Date.now() + SESSION_MS]);
        await db.execute("DELETE FROM user_sessions WHERE expires_at <= ?", [Date.now()]);
        setCookie(req, res, token, SESSION_MS);
        return { username: user.username, steam_url: user.steam_url };
    }
    router.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        if (req.method !== "GET") {
            const origin = req.headers.origin;
            if (origin && origin !== `${req.protocol}://${req.get("host")}`) {
                return res.status(403).json({ error: "Please use this site's login form." });
            }
            if (!req.is("application/json")) return res.status(415).json({ error: "JSON request required." });
        }
        next();
    });
    function limit(req, res, next) {
        const now = Date.now();
        for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
        const key = req.ip;
        const attempt = attempts.get(key) || { count: 0, until: now + 15 * 60000 };
        attempt.count++;
        if (attempt.count > 30 || (!attempts.has(key) && attempts.size >= 10000)) {
            res.set("Retry-After", String(Math.max(1, Math.ceil((attempt.until - now) / 1000))));
            return res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
        }
        attempts.set(key, attempt);
        next();
    }
    router.post("/register", limit, async (req, res) => {
        const { password, steam_url = "" } = req.body || {};
        const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
        if (!/^[A-Za-z0-9_-]{3,30}$/.test(username)) return res.status(400).json({ error: "Use 3–30 letters, numbers, underscores or hyphens for your username." });
        if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({ error: "Use a password of at least 8 characters (up to 72 UTF-8 bytes)." });
        }
        let steamUrl = "";
        if (steam_url) {
            if (typeof steam_url !== "string" || steam_url.length > 255) return res.status(400).json({ error: "Enter a valid Steam profile URL." });
            try {
                const url = new URL(steam_url);
                if (url.protocol !== "https:" || url.hostname !== "steamcommunity.com" ||
                    !/^\/(?:profiles\/\d{17}|id\/[A-Za-z0-9_-]+)\/?$/.test(url.pathname) || url.username || url.password) throw new Error();
                steamUrl = `https://steamcommunity.com${url.pathname}`;
            } catch { return res.status(400).json({ error: "Use https://steamcommunity.com/id/yourname or /profiles/your Steam ID." }); }
        }
        try {
            await init();
            const passwordHash = await bcrypt.hash(password, 10);
            const [result] = await db.execute("INSERT INTO users (username, password_hash, steam_url) VALUES (?, ?, ?)",
                [username, passwordHash, steamUrl]);
            const user = await issue(req, res, { id: result.insertId, username, steam_url: steamUrl });
            res.status(201).json({ ok: true, user });
        } catch (err) {
            if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That username is already taken." });
            console.error("Registration failed:", err.message);
            res.status(503).json({ error: "Could not create your account right now. Please try again." });
        }
    });
    router.post("/login", limit, async (req, res) => {
        const { password } = req.body || {};
        const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
        if (!username || username.length > 50 || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({ error: "Enter your username and password." });
        }
        try {
            const [rows] = await db.execute("SELECT id, username, password_hash, steam_url FROM users WHERE username = ? LIMIT 1", [username]);
            const row = rows[0];
            if (!row || !await bcrypt.compare(password, row.password_hash)) {
                return res.status(401).json({ error: "Incorrect username or password." });
            }
            res.json({ ok: true, user: await issue(req, res, row) });
        } catch (err) {
            console.error("Login failed:", err.message);
            res.status(503).json({ error: "Login is temporarily unavailable. Please try again." });
        }
    });
    router.get("/me", async (req, res) => {
        const token = tokenFrom(req);
        if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.json({ user: null });
        try {
            await init();
            const [rows] = await db.execute(`SELECT u.username, u.steam_url FROM user_sessions s
                JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`, [hash(token), Date.now()]);
            res.json({ user: rows[0] || null });
        } catch (err) {
            console.error("Session lookup failed:", err.message);
            res.status(503).json({ error: "Could not check your session. Please try again." });
        }
    });
    router.post("/profile", async (req, res) => {
        const token = tokenFrom(req);
        if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: "Please sign in first." });
        const value = req.body?.steam_url;
        const steamUrl = value === "" ? "" : parseSteamProfileUrl(value);
        if (steamUrl === null) return res.status(400).json({ error: "Enter a valid https://steamcommunity.com/id/… or /profiles/… URL." });
        try {
            await init();
            const [rows] = await db.execute(`SELECT u.id, u.username FROM user_sessions s JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`, [hash(token), Date.now()]);
            if (!rows[0]) return res.status(401).json({ error: "Your session expired. Please sign in again." });
            await db.execute("UPDATE users SET steam_url = ? WHERE id = ?", [steamUrl, rows[0].id]);
            res.json({ ok: true, user: { username: rows[0].username, steam_url: steamUrl } });
        } catch (err) { res.status(503).json({ error: "Could not save your Steam profile. Please try again." }); }
    });
    router.post("/logout", async (req, res) => {
        try {
            await init();
            const token = tokenFrom(req);
            if (token) await db.execute("DELETE FROM user_sessions WHERE token_hash = ?", [hash(token)]);
            setCookie(req, res, "", 0);
            res.json({ ok: true });
        } catch (err) {
            res.status(503).json({ error: "Could not sign out. Please try again." });
        }
    });
    return router;
}

export default createAuthRouter();
