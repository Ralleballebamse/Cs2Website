export function initSteamInfo(deps) {
    const {
        sleep,
        loadfiles,
        containers,
        mainContainer
    } = deps;

    async function loadInSteamData(steamid) {
        const steamLink = `/steam?steamid=${steamid}`;

        const steamInventoryData = await loadfiles(steamLink);
        return steamInventoryData;
    }

    async function fetchSteamId(steamid) {
        const profileContainer = document.getElementById("multipleProfileButtons");
        const r = await fetch(`/steam/profile?steamid=${steamid}`);
        const data = await r.json();

        const btn = document.createElement("button");
        const name = document.createElement("h4");
        const img = document.createElement("img");

        const containerPerSteamAccount = document.createElement("div");
        containerPerSteamAccount.classList.add("posts");
        containerPerSteamAccount.style.display = "none";

        containers.push(containerPerSteamAccount);
        mainContainer.append(containerPerSteamAccount);

        name.textContent = r.ok && data.name ? data.name : `Steam ${steamid}`;
        img.src = r.ok && data.avatar ? data.avatar : "/favicon.ico";
        img.alt = "";
        btn.append(img, name);

        btn.dataset.steamid = steamid;
        profileContainer.append(btn);

        return containerPerSteamAccount;
    }

    async function fetchweaponNameId(itemName) {
        await sleep(100000);
        const response = await fetch(`/api/steam/market/id?itemName=${encodeURIComponent(itemName)}`);

        if (!response.ok) {
            throw new Error("Failed to fetch marketID from backend");
        }

        const data = await response.json();
        return data.marketID;
    }

    async function fetchPrice(marketID, currency) {
        const response = await fetch(
            `/api/steam/market/price?marketID=${encodeURIComponent(marketID)}&currency=${encodeURIComponent(currency)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch price from backend");
        }

        const data = await response.json();
        return data.price;
    }

    return {
        loadInSteamData,
        fetchSteamId,
        fetchweaponNameId,
        fetchPrice,
    };
}
