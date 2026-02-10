function extractMatchId(url) {
    const m = url.match(/\/room\/(1-[0-9a-f-]{36})/i);
    return m ? m[1] : null;
}

chrome.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
    if (info.status !== "complete") return;

    const url = tab.url || "";
    if (!url.includes("faceit.com") || !url.includes("/room/")) return;

    const matchId = extractMatchId(url);
    if (!matchId) return;

    fetch("http://localhost:3000/api/faceit/current-matchid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
    }).catch(() => { });
});
