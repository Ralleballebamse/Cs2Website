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
    const steamid = "76561198992052209";
    const steamLink = `/steam?steamid=${steamid}`;

    steamInventoryData = await loadfiles(steamLink);
    invData = steamInventoryData;

    console.log(invData);

    const postContainer = document.getElementById("posts");
    for (let i = 0; i <= invData.descriptions.length-1; i++) {
        const post = document.createElement("div");
        post.classList.add("post");

        const itemName = document.createElement("h4");
        itemName.textContent = invData.descriptions[i].name;

        const itemImage = document.createElement("img");
        itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[i].icon_url}`;

        const itemPrice = document.createElement("h6");
        itemPrice.textContent = "Market value: ";

        post.append(itemName, itemImage, itemPrice);
        postContainer.append(post);
    }
}

main();