import { steamSessionCache as cache } from "./sessionCache.js";

const PROFILE_TTL = 24 * 60 * 60 * 1000;
const INVENTORY_TTL = PROFILE_TTL;

export function initSteamInfo(deps) {
    const {
        loadfiles,
        containers,
        mainContainer
    } = deps;

    async function loadInSteamData(steamid) {
        const steamLink = `/steam?steamid=${steamid}`;

        return cache.load(`inventory:${steamid}`, INVENTORY_TTL, () => loadfiles(steamLink),
            data => Boolean(data?.privateInventory ||
                (Array.isArray(data?.assets) && Array.isArray(data?.descriptions) && data?.ok !== false)));
    }

    async function fetchSteamId(steamid) {
        const profileContainer = document.getElementById("multipleProfileButtons");
        let data;
        try {
            data = await cache.load(`profile:${steamid}`, PROFILE_TTL, async () => {
                const r = await fetch(`/steam/profile?steamid=${steamid}`);
                if (!r.ok) throw new Error(`Profile request failed (HTTP ${r.status})`);
                return r.json();
            }, result => Boolean(result?.name && result?.avatar));
        } catch (err) {
            console.warn(`Steam ${steamid}: ${err.message}`);
            data = {};
        }

        const btn = document.createElement("button");
        const name = document.createElement("h4");
        const img = document.createElement("img");

        const containerPerSteamAccount = document.createElement("div");
        containerPerSteamAccount.classList.add("posts");
        containerPerSteamAccount.style.display = "none";

        containers.push(containerPerSteamAccount);
        mainContainer.append(containerPerSteamAccount);

        name.textContent = data.name || `Steam ${steamid}`;
        containerPerSteamAccount.dataset.playerName = name.textContent;
        if (data.avatar) img.src = data.avatar;
        img.alt = "";
        btn.append(img, name);

        btn.dataset.steamid = steamid;
        profileContainer.append(btn);

        return containerPerSteamAccount;
    }

    return {
        loadInSteamData,
        fetchSteamId,
        hasCachedPlayer: steamid => cache.get(`profile:${steamid}`) !== null && cache.get(`inventory:${steamid}`) !== null,
    };
}
