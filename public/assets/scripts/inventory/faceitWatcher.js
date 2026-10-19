import { steamSessionCache as cache } from "../shared/sessionCache.js";

export function startFaceitWatcher({ sleep, onNewSteamIds, pollMs = 2000 }) {
    let lastMatchId = null;
    let stopped = false;

    (async function loop() {
        while (!stopped) {
            try {
                const r = await fetch("/api/faceit/current-matchid");
                if (!r.ok) throw new Error(`Match lookup failed (HTTP ${r.status})`);
                const { matchId } = await r.json();

                if (matchId && matchId !== lastMatchId) {
                    const data = await cache.load(`match:${matchId}`, 5 * 60 * 1000, async () => {
                        const res = await fetch(`/api/faceit/match-steamids?matchId=${encodeURIComponent(matchId)}`);
                        if (!res.ok) throw new Error(`Match players lookup failed (HTTP ${res.status})`);
                        const result = await res.json();
                        if (!Array.isArray(result.steamIds) || !result.steamIds.length) throw new Error("Match players not available yet");
                        return result;
                    });

                    // IMPORTANT: ensure it's always an array
                    const steamIds = Array.isArray(data.steamIds) ? data.steamIds : [];

                    // IMPORTANT: call callback with the expected shape
                    await onNewSteamIds({ matchId, steamIds });
                    lastMatchId = matchId;
                }
            } catch (err) {
                console.error("faceit watcher error:", err);
            }

            await sleep(pollMs);
        }
    })();

    return { stop: () => (stopped = true) };
}
