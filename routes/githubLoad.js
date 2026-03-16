import express from "express";
import mysql from "mysql2/promise";

const router = express.Router();

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "cs2dev",
    password: "cs2dev123",
    database: "cs2_website",
});

const res = await fetch(
    "https://raw.githubusercontent.com/somespecialone/steam-item-name-ids/refs/heads/master/data/cs2.json",
);

const text = await res.text();

const lines = text.split("\n");

//"AK-47 | Wild Lotus (Factory New)": 176097603,
//  '★ StatTrak™ Paracord Knife | Fade (Factory New)': 176097738,


let marketID;
let weaponName;
let weaponSkin;
let wear;
let weaponStattrak;
let weaponSouvenir;

let cleaned;
let splitId;
let itemPart;
let parts;

let counter = 0;

for (const line of lines) {
    counter++;
    console.log(line);

    try {
        weaponStattrak = line.includes("StatTrak™") ? 1 : 0;
        weaponSouvenir = line.includes("Souvenir") ? 1 : 0;

        cleaned = line.trim().replace(/^'/, "").replace(/',$/, "").replace(/,$/, "");
        splitId = cleaned.split("': ");

        cleaned = line.trim().replace(/,$/, "");

        splitId = cleaned.split('": ');

        itemPart = splitId[0].replace(/^"/, "");
        marketID = splitId[1];

        parts = itemPart.split(" | ");

        weaponName = parts[0];
        weaponSkin = null;
        wear = null;

        if (parts.length > 1) {
            let skinParts = parts[1].split(" (");
            weaponSkin = skinParts[0];

            if (skinParts.length > 1) {
                wear = skinParts[1].replace(")", "");
            }
        }

        weaponName = weaponName
            .replace("★ ", "")
            .replace("StatTrak™ ", "")
            .replace("Souvenir ", "")
            .trim();

    } catch (err) {
        console.log("Save to DB error:", err);
    }

    console.log({
        weaponName,
        weaponSkin,
        wear,
        marketID,
        weaponStattrak,
        weaponSouvenir
    });

    try {
        await pool.execute(
            `INSERT INTO items (marketID, weapon, name, condition_name, is_stattrak, is_souvenir)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [marketID, weaponName, weaponSkin, wear, weaponStattrak, weaponSouvenir]
        );

    } catch (err) {
        console.error("DB insert error:", err);
    }
}
console.log("done");

export default router;