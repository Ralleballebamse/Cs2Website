export function startFaceitWatcher({ sleep, onNewSteamIds, pollMs = 2000 }) {
    let lastMatchId = null;
    let stopped = false;

    (async function loop() {
        while (!stopped) {
            try {
                const r = await fetch("/api/faceit/current-matchid");
                const { matchId } = await r.json();

                if (matchId && matchId !== lastMatchId) {
                    lastMatchId = matchId;

                    const res = await fetch(
                        `/api/faceit/match-steamids?matchId=${encodeURIComponent(matchId)}`
                    );
                    const data = await res.json();

                    // IMPORTANT: ensure it's always an array
                    const steamIds = Array.isArray(data.steamIds) ? data.steamIds : [];

                    // IMPORTANT: call callback with the expected shape
                    await onNewSteamIds({ matchId, steamIds });
                }
            } catch (err) {
                console.error("faceit watcher error:", err);
            }

            await sleep(pollMs);
        }
    })();

    return { stop: () => (stopped = true) };
}