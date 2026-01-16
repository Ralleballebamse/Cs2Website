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
    const steamid = "76561198158780614";
    const steamLink = `/steam?steamid=${steamid}`;

    steamInventoryData = await loadfiles(steamLink);
    invData = steamInventoryData;

    console.log(invData);

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn.addEventListener("click", () => {
        loadMorePosts();
    });

    const postContainer = document.getElementById("posts");

    loadMorePosts();

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

    async function loadMorePosts() {
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
                itemPrice.textContent = "Market value: ";

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
                postContainer.append(post);
            }
            countItems = end;
        }
    }
    if (countItems >= invData.descriptions.length) {
        loadMoreBtn.style.display = "none";
    }
}


main();