import express from "express";

const router = express.Router();

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const BASE = "https://open.faceit.com/data/v4";

if (!FACEIT_API_KEY) {
    console.warn("Missing FACEIT_API_KEY env var. FACEIT requests will fail.");
}

router.use(express.json());   // needed to read POST body

let latestMatchId = null;

router.post("/current-matchid", (req, res) => {
    const matchId = String(req.body?.matchId || "").trim();

    if (!/^1-[0-9a-f-]{36}$/i.test(matchId)) {
        return res.status(400).json({ error: "Invalid matchId" });
    }

    latestMatchId = matchId;
    console.log("Received matchId:", matchId);

    res.json({ ok: true });
});

router.get("/current-matchid", (req, res) => {
    res.json({ matchId: latestMatchId });
});

async function faceitGet(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    const controller = new AbortController();
    const timeoutMs = 8000; // 8 seconds
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
            signal: controller.signal,
        });

        // Basic rate-limit handling
        if (res.status === 429) {
            const retryAfter = Number(res.headers.get("retry-after") || "1");
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            return faceitGet(path, params);
        }

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`FACEIT ${res.status} ${res.statusText}: ${text}`);
        }

        return await res.json();
    } finally {
        clearTimeout(t);
    }
}

// In-memory cache to reduce FACEIT calls
const activeMatchCache = new Map();

async function getActiveMatchSnapshot(mySteamId64) {
    const cached = activeMatchCache.get(mySteamId64);
    const now = Date.now();
    if (cached && now - cached.ts < 3000) return cached.payload;

    // SteamID64 -> FACEIT player
    const me = await faceitGet("/players", {
        game: "cs2",
        game_player_id: mySteamId64,
    });

    const myPlayerId = me.player_id;
    if (!myPlayerId) {
        const payload = { active: false, matchId: null, status: null, steamIds: [] };
        activeMatchCache.set(mySteamId64, { ts: now, payload });
        return payload;
    }

    // Use history (this endpoint exists)
    const history = await faceitGet(`/players/${myPlayerId}/history`, {
        game: "cs2",
        limit: 20,
    });

    const items = history.items || [];

    // Check newest matches first
    for (const h of items) {
        console.log("History match:", h.match_id);

        const match = await faceitGet(`/matches/${h.match_id}`);

        const status = match?.status; // MUST be declared before any use
        console.log("Match status:", status);

        if (!["ONGOING", "READY", "CONFIGURING"].includes(status)) continue;

        const rosters = Object.values(match.teams || {}).flatMap((t) => t.roster || []);
        const steamIds = [...new Set(rosters.map((p) => p.game_player_id).filter(Boolean))];

        const payload = { active: true, matchId: match.match_id, status, steamIds };
        activeMatchCache.set(mySteamId64, { ts: now, payload });
        return payload;
    }

    const payload = { active: false, matchId: null, status: null, steamIds: [] };
    activeMatchCache.set(mySteamId64, { ts: now, payload });
    return payload;
}


router.get("/active-match", async (req, res) => {
    try {
        const steamId64 = String(req.query.steamId64 || "").trim();
        if (!/^\d{17}$/.test(steamId64)) {
            return res.status(400).json({ error: "Invalid steamId64. Expected 17-digit SteamID64." });
        }

        const snapshot = await getActiveMatchSnapshot(steamId64);
        return res.json(snapshot);
    } catch (err) {
        return res.status(500).json({
            error: "Failed to fetch active match snapshot.",
            detail: err?.message || String(err),
        });
    }
});

router.get("/linked", async (req, res) => {
    try {
        const steamId64 = String(req.query.steamId64 || "").trim();
        if (!/^\d{17}$/.test(steamId64)) {
            return res.status(400).json({ error: "Invalid steamId64. Expected 17-digit SteamID64." });
        }

        // If the Steam account is linked to FACEIT (for cs2), this returns a player object.
        const player = await faceitGet("/players", { game: "cs2", game_player_id: steamId64 });

        return res.json({
            linked: true,
            player_id: player.player_id,
            nickname: player.nickname,
            country: player.country,
            avatar: player.avatar,
        });
    } catch (err) {
        // FACEIT returns 404 if not found/linked (or sometimes 400 depending)
        const msg = err?.message || String(err);

        if (msg.includes("404")) {
            return res.json({ linked: false });
        }

        return res.status(500).json({
            error: "Failed to check FACEIT linkage.",
            detail: msg,
        });
    }
});

router.get("/match-steamids", async (req, res) => {
    try {
        const matchId = String(req.query.matchId || "").trim();
        if (!matchId) return res.status(400).json({ error: "matchId is required" });

        const match = await faceitGet(`/matches/${matchId}`);

        const rosters = Object.values(match.teams || {}).flatMap((t) => t.roster || []);
        const steamIds = [...new Set(rosters.map((p) => p.game_player_id).filter(Boolean))];

        return res.json({
            matchId: match.match_id,
            status: match.status,
            steamIds,
            count: steamIds.length,
        });
    } catch (err) {
        return res.status(500).json({
            error: "Failed to fetch match steam IDs",
            detail: err?.message || String(err),
        });
    }
});

export default router;
