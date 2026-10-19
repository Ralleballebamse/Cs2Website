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
        containerPerSteamAccount.dataset.playerName = name.textContent;
        img.src = r.ok && data.avatar ? data.avatar : "/favicon.ico";
        img.alt = "";
        btn.append(img, name);

        btn.dataset.steamid = steamid;
        profileContainer.append(btn);

        return containerPerSteamAccount;
    }

    return {
        loadInSteamData,
        fetchSteamId,
    };
}
