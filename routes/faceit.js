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
