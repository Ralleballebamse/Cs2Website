let timer;
let running = false;
let refreshRequested = false;
let expiryTimer;

function expirePrices() {
    clearTimeout(expiryTimer);
    let next = Infinity;
    for (const node of document.querySelectorAll("[data-price-expires]")) {
        const expires = Number(node.dataset.priceExpires);
        if (expires <= Date.now()) {
            node.textContent = "Market value : refreshing";
            delete node.dataset.priceExpires;
        } else next = Math.min(next, expires);
    }
    if (Number.isFinite(next)) expiryTimer = setTimeout(expirePrices, Math.max(0, next - Date.now()));
}

document.addEventListener("visibilitychange", expirePrices);

export function requestMarketPrices() {
    if (running) { refreshRequested = true; return; }
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
}

async function refresh() {
    timer = null;
    running = true;
    let retry = false;
    let delay = 2000;
    const names = [...new Set([...document.querySelectorAll("[data-market-name]")]
        .map(node => node.dataset.marketName))];
    try {
        for (let i = 0; i < names.length; i += 500) {
            const response = await fetch("/api/steam/market/prices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ names: names.slice(i, i + 500) }),
            });
            if (!response.ok) {
                const error = new Error(response.status === 404 ?
                    "Price endpoint missing. Restart npm run dev to load the updated backend." :
                    `Price cache unavailable (HTTP ${response.status})`);
                error.restartRequired = response.status === 404;
                throw error;
            }
            const data = await response.json();
            delay = Math.max(delay, data.retryAfterMs || 0);
            for (const node of document.querySelectorAll("[data-market-name]")) {
                const result = data.prices[node.dataset.marketName];
                if (!result) continue;
                delete node.dataset.priceError;
                node.textContent = result.price ? `Market value : ${result.price}` :
                    result.status === "pending" ? "Market value : fetching" :
                    result.status === "paused" ? "Market value : Steam cooldown" : "Market value : unavailable";
                node.title = result.updatedAt ? `${result.source}; fetched ${new Date(result.updatedAt).toLocaleString()}` :
                    "No Steam price fetched within the last 24 hours";
                if (result.expiresAt) node.dataset.priceExpires = String(result.expiresAt);
                else delete node.dataset.priceExpires;
            }
        }
        expirePrices();
        // Keep prices fresh while this page is open, including cloned/sorted cards.
        retry = names.length > 0;
    } catch (err) {
        console.warn(err.message);
        for (const node of document.querySelectorAll("[data-market-name]")) {
            if (!node.dataset.priceExpires || node.dataset.priceError) {
                node.textContent = err.restartRequired ? "Market value : restart server" :
                    "Market value : temporarily unavailable";
                node.title = err.message;
                node.dataset.priceError = "true";
            }
        }
        retry = names.length > 0;
        delay = 60000;
    } finally {
        running = false;
        if (refreshRequested) {
            refreshRequested = false;
            timer = setTimeout(refresh, 100);
        } else if (retry) timer = setTimeout(refresh, delay);
    }
}
