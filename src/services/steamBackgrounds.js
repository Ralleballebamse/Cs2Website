const CDN = "https://shared.fastly.steamstatic.com/community_assets/images/";

function asset(path, extensions) {
    if (typeof path !== "string" || !/^items\/\d+\/[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(path)) return null;
    return extensions.includes(path.split(".").pop().toLowerCase()) ? CDN + path : null;
}

export function createSteamBackgrounds({ fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
    const cache = new Map();
    const inFlight = new Map();
    return {
        async get(steamid) {
            if (typeof steamid !== "string" || !/^\d{17}$/.test(steamid)) {
                throw Object.assign(new Error("Invalid Steam ID"), { status: 400 });
            }
            const cached = cache.get(steamid);
            if (cached && now() < cached.expiresAt) return cached.data;
            if (inFlight.has(steamid)) return inFlight.get(steamid);
            const task = (async () => {
                const response = await fetchImpl(`https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?steamid=${steamid}`, {
                    signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) throw Object.assign(new Error("Steam background temporarily unavailable"), { status: response.status });
                const data = await response.json();
                if (!data.response || typeof data.response !== "object") throw new Error("Invalid Steam background response");
                const item = data.response.profile_background;
                const image = asset(item?.image_large, ["jpg", "jpeg", "png", "webp", "gif"]);
                const webm = asset(item?.movie_webm, ["webm"]);
                const mp4 = asset(item?.movie_mp4, ["mp4"]);
                const result = { background: image || webm || mp4 ? { image, webm, mp4, title: item.item_title || "Steam profile background" } : null };
                if (cache.size >= 1000) cache.delete(cache.keys().next().value);
                cache.set(steamid, { data: result, expiresAt: now() + 3600000 });
                return result;
            })().finally(() => inFlight.delete(steamid));
            inFlight.set(steamid, task);
            return task;
        },
    };
}

export const steamBackgrounds = createSteamBackgrounds();
