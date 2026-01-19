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
    let countItems = 0; // Starts at 1 because list starts at 0
    let totalItemDisplayed = 9; // 9 items displayed in start
    let arrayAssets = new Array; // Array for avoiding dublications of items
    let arrayMarketHashNames = new Array; // Array for all market hast names that being send to steam market place to recive lowest value

    const steamid = "76561198992052209";
    const steamLink = `/steam?steamid=${steamid}`;

    steamInventoryData = await loadfiles(steamLink);
    invData = steamInventoryData;

    console.log(invData);

        const res = await fetch(
        "https://raw.githubusercontent.com/somespecialone/steam-item-name-ids/refs/heads/master/data/cs2.json",
    );

    const itemDB = await res.json();

    // fetchData("Souvenir MP7 | Prey (Field-Tested)", "$");

    async function fetchData(marketName, currency) {
        const currencyId = currency === "€" ? 3 : 1;
        const response = await fetch(
           ` /api/steam?item_nameid=${itemDB[marketName]}&currency=${currencyId}`
        );
        const test = await response.json();

        let price = [];

        if (currency === "€") {
            price = test.sell_order_table.split("€")[0].split(">");
            price = price[price.length - 1] + currency;
        } else {
            price = currency + test.sell_order_table.split("$")[1].split("<")[0];
        }

        console.log(price);
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

    const testContainer = document.createElement("div");


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

    function loadAllMarketHashNames() {
        let x = 0;
        for (let z = 0; z <= invData.descriptions.length - 1; z++) {
            arrayMarketHashNames.push(invData.descriptions[x].market_hash_name);
            x++;
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
                itemPrice.textContent = `Market value : ${await fetchData(invData.descriptions[i].market_hash_name, "$")}`;

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