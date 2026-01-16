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
    const steamid = "76561198992052209";
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

    function createItemInspectLink(i){
        const asset = invData.assets[i];
        const desc = invData.descriptions.find(d =>
        d.classid === asset.classid &&
        d.instanceid === asset.instanceid
        );
        const inspectLink = desc.actions[0].link
        .replace("%owner_steamid%", steamid)
        .replace("%assetid%", asset.assetid);

        return(inspectLink)
    }

    async function loadMorePosts() {
        const end = countItems + totalItemDisplayed;

        for (let i = countItems; i < end && i < invData.descriptions.length; i++) {
            const post = document.createElement("div");
            post.classList.add("post");

            const itemName = document.createElement("h4");
            itemName.textContent = invData.descriptions[i].name;

            const itemImage = document.createElement("img");
            itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[i].icon_url}`;

            const itemPrice = document.createElement("h6");
            itemPrice.textContent = "Market value: ";

            if (invData.descriptions[i].tags && invData.descriptions[i].tags.length > 0) {
                const inspectBtn = document.createElement("button");
                inspectBtn.textContent = "Inspect";

                inspectBtn.addEventListener("click", () => {
                    const link = createItemInspectLink(i);
                    window.location.href = link;
                });
                post.append(itemName, itemImage, itemPrice, inspectBtn);
            }else{
                post.append(itemName, itemImage, itemPrice);
            }
            postContainer.append(post);
        }
        countItems = end;
        
        if (countItems >= invData.descriptions.length){
            loadMoreBtn.style.display = "none";
        }
    }
}

main();