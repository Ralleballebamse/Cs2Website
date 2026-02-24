export function initSteamInfo(deps) {
    const {
        sleep,
        loadfiles,
        containers,
        mainContainer
    } = deps;

    async function loadInSteamData(steamid) {
        const steamLink = `/steam?steamid=${steamid}`;

        await sleep(500);
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

        name.textContent = data.name;
        img.src = data.avatar;
        btn.append(img, name);

        btn.dataset.steamid = steamid;
        profileContainer.append(btn);

        return containerPerSteamAccount;
    }

    async function fetchData(marketName, currency) {
        const currencyId = currency === "€" ? 3 : 1;
        await sleep(100000);

        try {
            const res = await fetch(
                `/api/steam/lowest?name=${encodeURIComponent(marketName)}&currency=${currencyId}`
            );
            return (await res.text()).trim();
        } catch {
        }


        return currency === "€" ? "0.01€" : "$0.01";
    }

    return {
        loadInSteamData,
        fetchSteamId,
        fetchData,
    };
}
