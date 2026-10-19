import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "cs2dev",
    password: process.env.DB_PASSWORD || "cs2dev123",
    database: process.env.DB_NAME || "cs2_website",
    connectTimeout: 5000,
});
