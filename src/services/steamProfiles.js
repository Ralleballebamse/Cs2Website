export function parseSteamProfileUrl(value) {
    if (typeof value !== "string" || value.length > 255) return null;
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "https:" || url.hostname !== "steamcommunity.com" || url.username || url.password ||
            !/^\/(?:profiles\/\d{17}|id\/[A-Za-z0-9_-]+)\/?$/.test(url.pathname)) return null;
        return `https://steamcommunity.com${url.pathname}`;
    } catch { return null; }
}

const cache = new Map();
const inFlight = new Map();
function text(xml, tag) {
    const value = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "";
    return value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
}

export async function getSteamProfile(profileUrl) {
    const url = parseSteamProfileUrl(profileUrl);
    if (!url) throw Object.assign(new Error("Invalid Steam profile URL"), { status: 400 });
    const cached = cache.get(url);
    if (cached && Date.now() - cached.savedAt < 86400000) return cached.data;
    if (inFlight.has(url)) return inFlight.get(url);
    const task = (async () => {
        const response = await fetch(`${url.replace(/\/$/, "")}/?xml=1`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Object.assign(new Error("Steam profile temporarily unavailable"), { status: response.status });
        const xml = await response.text();
        const steamid = text(xml, "steamID64");
        const name = text(xml, "steamID");
        const avatar = text(xml, "avatarFull");
        if (!/^\d{17}$/.test(steamid) || !name) throw Object.assign(new Error("Steam profile not found"), { status: 404 });
        const data = { steamid, name, avatar };
        if (cache.size >= 1000) cache.delete(cache.keys().next().value);
        cache.set(url, { data, savedAt: Date.now() });
        cache.set(`https://steamcommunity.com/profiles/${steamid}`, { data, savedAt: Date.now() });
        return data;
    })().finally(() => inFlight.delete(url));
    inFlight.set(url, task);
    return task;
}
