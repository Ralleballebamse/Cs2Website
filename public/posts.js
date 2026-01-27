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
    let totalItemDisplayed = 200; // 9 items displayed in start
    let arrayAssets = new Array; // Array for avoiding dublications of items
    const containers = [];
    let lastShown = null;

    async function loadInSteamData(steamid) {
        const steamLink = `/steam?steamid=${steamid}`;

        steamInventoryData = await loadfiles(steamLink);
        invData = steamInventoryData;
        console.log(invData);

        return (invData);
    }

    const mainContainer = document.getElementById("mainContainer");

    const res = await fetch(
        "https://raw.githubusercontent.com/somespecialone/steam-item-name-ids/refs/heads/master/data/cs2.json",
    );

    const itemDB = await res.json();

    let hello = ["76561198992052209", "76561198158780614", "76561198063864524"]
    const steamProfileButtons = [];

    async function fetchSteamId(steamid) {
        let x = 0;
        x++;
        const profileContainer = document.getElementById("multipleProfileButtons");
        const r = await fetch(`/steam/profile?steamid=${steamid}`);
        const data = await r.json();

        const btn = document.createElement("button");
        const name = document.createElement("h4");
        const img = document.createElement("img");
        const ContainerPerSteamAccount = document.createElement("div");
        ContainerPerSteamAccount.classList.add("posts");
        ContainerPerSteamAccount.style.display = "none";
        containers.push(ContainerPerSteamAccount);

        mainContainer.append(ContainerPerSteamAccount);

        name.textContent = data.name;
        img.src = data.avatar;
        btn.append(img, name);

        btn.dataset.steamid = steamid;

        profileContainer.append(btn);
        return (ContainerPerSteamAccount);
    }


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
        }
        return (price)
    }


    const steamProfileButtonAll = document.getElementById("multipleProfileButtons")
    steamProfileButtonAll.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        const buttons = steamProfileButtonAll.querySelectorAll("button");
        const index = Array.from(buttons).indexOf(btn);

        displayVisibleOrHidden(containers[index]);
    });


    const sortItemsByHighPriceToLow = document.getElementById("sortItemsByHighPriceToLowBtn");
    sortItemsByHighPriceToLow.addEventListener("click", () => {
        sortItemsByHighPriceToLowFunction("HighToLow");
    });


    const sortItemsByLowPriceToHigh = document.getElementById("sortItemsByLowPriceToHighBtn");
    sortItemsByLowPriceToHigh.addEventListener("click", () => {
        sortItemsByHighPriceToLowFunction("LowToHigh");
    });


    const switchToMain = document.getElementById("switchToMain");
    switchToMain.addEventListener("click", () => {
        displayVisibleOrHidden(normalPostContainer);
    });


    const normalPostContainer = document.getElementById("posts");
    const itemSortContainer = document.getElementById("sortedPosts");
    itemSortContainer.style.display = "none";
    lastShown = normalPostContainer;


    function createItemInspectLink(z, steamid) {
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


    async function sortItemsByHighPriceToLowFunction(sort) {
        displayVisibleOrHidden(itemSortContainer);
        const posts = Array.from(normalPostContainer.querySelectorAll(".post"));
        posts.sort((a, b) => {
            const priceA = parseFloat(
                a.querySelector("h6").textContent.replace(/[^0-9.]/g, "")
            );
            const priceB = parseFloat(
                b.querySelector("h6").textContent.replace(/[^0-9.]/g, "")
            );

            if (sort === "HighToLow") {
                return priceB - priceA;
            } else if (sort === "LowToHigh") {
                return priceA - priceB;
            }
        })

        itemSortContainer.innerHTML = "";
        posts.forEach(post => {
            itemSortContainer.appendChild(post.cloneNode(true));
        });
    }

    function displayVisibleOrHidden(show) {
        if (!show) return;

        if (lastShown && lastShown !== show) {
            lastShown.style.display = "none";
        }

        show.style.display = "grid";
        lastShown = show;
    }


    async function runAndStream() {
        console.log("Starting all tasks...\n");

        for (let i = 1; i <= 3; i++) {
            const taskName = `Task ${i}`;

            // Start the async work
            steamdata = await loadInSteamData(hello[i - 1]);
            ContainerPerSteamAccount = await fetchSteamId(hello[i - 1]);
            const promise = loadMoreItems(steamdata, hello[i - 1], ContainerPerSteamAccount);

            // Attach a handler for WHEN it finishes
            promise.then(result => {
                console.log("STREAM:", result);
            });
        }

        console.log("\nAll tasks have been started (but not finished yet)");
    }
    await runAndStream();










    async function loadMoreItems(invData, steamid, ContainerPerSteamAccount) {
        const descByClass = new Map(invData.descriptions.map(d => [d.classid, d]));
        console.log(descByClass);

        for (let z = 0; z < invData.assets.length; z++) {
            const asset = invData.assets[z];
            const classid = asset?.classid;
            if (!classid) continue;

            const desc = descByClass.get(classid);
            if (!desc) continue;

            const exclude = desc.tags?.some(tag =>
                tag.internal_name.includes("MusicKit") ||
                tag.internal_name.includes("Collectible") ||
                tag.internal_name.includes("Sticker") ||
                tag.internal_name.includes("Spray") ||
                tag.internal_name.includes("Ticket") ||
                tag.internal_name.includes("Tool")
            );

            if (exclude) continue;

            if (arrayAssets.includes(classid)) continue;
            arrayAssets.push(classid);

            const post = document.createElement("div");
            post.classList.add("post");

            const itemName = document.createElement("h4");
            itemName.textContent = desc.name;

            const itemImage = document.createElement("img");
            itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url ?? ""}`;

            const itemPrice = document.createElement("h6");

           try {
                itemPrice.textContent = `Market value : ${await fetchData(desc.market_hash_name, "$")}`;
            } catch (err) {
                itemPrice.textContent = "Market value : $0.01";
            }

            post.append(itemName, itemImage, itemPrice);

            normalPostContainer.append(post);
            ContainerPerSteamAccount.append(post.cloneNode(true));
        }

        mainContainer.append(ContainerPerSteamAccount);
    }
}

main();