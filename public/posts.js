async function loadfiles(link) {
    try {
        const response = await fetch(link);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error loading file:", err);
    }
}

async function main() {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); // This is for making an await sleep
    let countItems = 0; // Starts at 1 because list starts at 0
    let totalItemDisplayed = 1000; // 9 items displayed in start
    let arrayAssets = new Array; // Array for avoiding dublications of items

    const steamid = "76561198992052209";
    const steamLink = `/steam?steamid=${steamid}`;

    steamInventoryData = await loadfiles(steamLink);
    invData = steamInventoryData;

    console.log(invData);

    const res = await fetch(
        "https://raw.githubusercontent.com/somespecialone/steam-item-name-ids/refs/heads/master/data/cs2.json",
    );

    const itemDB = await res.json();

    async function fetchData(marketName, currency) {
        const currencyId = currency === "€" ? 3 : 1;

        const response = await fetch(
            ` /api/steam?item_nameid=${itemDB[marketName]}&currency=${currencyId}`
        );

        const test = await response.json();

        let price = [];

        try {
            if (currency === "€") {
                price = test.sell_order_table.split("€")[0].split(">");
                price = price[price.length - 1] + currency;
            } else {
                price = currency + test.sell_order_table.split("$")[1].split("<")[0];
            }
        } catch (err) {
            for (let z = 0; z < 5; z++) {
                await sleep(z * 1000);
                try {
                    const res = await fetch(
                        `/api/steam/lowest?name=${encodeURIComponent(marketName)}&currency=${currencyId}`
                    );
                    const priceText = (await res.text()).trim();
                    return (priceText)
                } catch (err) {
                    continue;
                }
            }
            return ("Undefined");
        }
        return (price)
    }

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn.addEventListener("click", () => {
        loadMoreItems();
    });

    const sortItemsByHighPriceToLow = document.getElementById("sortItemsByHighPriceToLowBtn");
    sortItemsByHighPriceToLow.addEventListener("click", () => {
        sortItemsByHighPriceToLowFunction();
    });

    const normalPostContainer = document.getElementById("posts");
    const testContainer = document.createElement("div");

    loadMoreItems();

    function createItemInspectLink(z) {
        const asset = invData.assets[z];
        const desc = invData.descriptions.find(d =>
            d.classid === asset.classid &&
            d.instanceid === asset.instanceid
        );
        const inspectLink = desc.actions[0].link
            .replace("%owner_steamid%", steamid)
            .replace("%assetid%", asset.assetid);

        return (inspectLink)
    }

    async function sortItemsByHighPriceToLowFunction() {
        displayVisibleOrHidden(normalPostContainer, testContainer)

    }

    function displayVisibleOrHidden(show = showcontainer, hide = hideContainer) {
        if (show.style.visibility === "hidden") {
            hide.style.visibility = "hidden";
            show.style.visibility = "visible";
        } else {
            show.style.visibility = "hidden";
            hide.style.visibility = "visible";
        }
    }

    async function loadMoreItems() {
        const end = countItems + totalItemDisplayed;


        let i = countItems;
        for (let z = 0; z <= invData.assets.length - 1 && i < end; z++) {
            if (!arrayAssets.includes(invData.assets[z].classid)) {
                arrayAssets.push(invData.assets[z].classid);

                const post = document.createElement("div");
                post.classList.add("post");

                const itemName = document.createElement("h4");
                itemName.textContent = invData.descriptions[i].name;

                const itemImage = document.createElement("img");
                itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[i].icon_url}`;

                const itemPrice = document.createElement("h6");
                if (invData.descriptions[i].tags.some(
                    tag => tag.category === ("Type") &&
                        tag.internal_name.startsWith("CSGO_Type_") &&
                        !tag.internal_name.includes("MusicKit") &&
                        !tag.internal_name.includes("Collectible") ||
                        tag.internal_name.startsWith("Type_Hands") ||
                        tag.internal_name.startsWith("CSGO_Tool_Sticker")
                )) {
                    itemPrice.textContent = `Market value : ${await fetchData(invData.descriptions[i].market_hash_name, "$")}`;
                } else {
                    itemPrice.textContent = "Market value : Undefined";
                }

                if (
                    invData.descriptions[i].tags &&
                    invData.descriptions[i].tags.some(tag =>
                        tag.category === "Type" &&
                        tag.internal_name.startsWith("CSGO_Type_") &&
                        !tag.internal_name.includes("MusicKit") &&
                        !tag.internal_name.includes("Collectible") &&
                        !tag.internal_name.includes("Spray") &&
                        !tag.internal_name.includes("WeaponCase") ||
                        tag.internal_name.startsWith("Type_Hands")
                    )
                ) {
                    const inspectBtn = document.createElement("button");
                    inspectBtn.textContent = "Inspect";

                    inspectBtn.addEventListener("click", () => {
                        const link = createItemInspectLink(z);
                        window.location.href = link;
                    });
                    post.append(itemName, itemImage, itemPrice, inspectBtn);
                } else {
                    post.append(itemName, itemImage, itemPrice);
                }
                i++
                normalPostContainer.append(post);
            }
            countItems = end;
        }

        if (countItems >= invData.descriptions.length) {
            loadMoreBtn.style.display = "none";
        }
    }
}


main();