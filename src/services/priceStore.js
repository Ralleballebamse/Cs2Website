import { pool } from "../config/database.js";

export const priceStore = {
    async load() {
        await pool.query(`CREATE TABLE IF NOT EXISTS steam_price_cache (
            market_hash_name VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PRIMARY KEY,
            price VARCHAR(64) NULL,
            checked_at BIGINT NULL,
            last_seen_at BIGINT NOT NULL
        )`);
        const [rows] = await pool.query("SELECT market_hash_name, price, checked_at, last_seen_at FROM steam_price_cache");
        return rows.map(row => [row.market_hash_name, {
            price: row.price, updatedAt: Number(row.checked_at) || null, lastSeenAt: Number(row.last_seen_at),
        }]);
    },
    async touch(names, time) {
        if (!names.length) return;
        await pool.query(`INSERT INTO steam_price_cache (market_hash_name, last_seen_at) VALUES ?
            ON DUPLICATE KEY UPDATE last_seen_at = VALUES(last_seen_at)`, [names.map(name => [name, time])]);
    },
    async save(name, entry) {
        await pool.execute(`UPDATE steam_price_cache SET price = ?, checked_at = ? WHERE market_hash_name = ?`,
            [entry.price, entry.updatedAt, name]);
    },
};
