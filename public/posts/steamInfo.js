export function initSteamInfo(deps) {
    const {
        sleep,
        loadfiles,
        containers,
        mainContainer,
        itemDB
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

        const response = await fetch(
            `/api/steam?item_nameid=${itemDB[marketName]}&currency=${currencyId}`
        );

        const test = await response.json();

        try {
            if (currency === "€") {
                let price = test.sell_order_table.split("€")[0].split(">");
                return price[price.length - 1] + currency;
            } else {
                return currency + test.sell_order_table.split("$")[1].split("<")[0];
            }
        } catch (err) {
            for (let z = 0; z < 5; z++) {
                await sleep(z * 1000);
                try {
                    const res = await fetch(
                        `/api/steam/lowest?name=${encodeURIComponent(marketName)}&currency=${currencyId}`
                    );
                    return (await res.text()).trim();
                } catch {
                    // retry
                }
            }
        }

        // fallback
        return currency === "€" ? "0.01€" : "$0.01";
    }

    return {
        loadInSteamData,
        fetchSteamId,
        fetchData,
    };
}
