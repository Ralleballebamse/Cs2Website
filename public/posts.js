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
    console.log(invData.total_inventory_count);
    console.log(invData.descriptions.length);
    console.log(invData.descriptions[0].name);
    console.log(invData.descriptions[0].icon_url);
    const imgUrl = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[0].icon_url}`;


    for (let i = 0; i <= invData.descriptions.length-1; i++) {
        //console.log(invData.descriptions[i].name);
    }
    console.log(
        "Image:",
        `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[0].icon_url}`
    );

    // Here I am trying to make an real post which later going to end up in the for-loop
        const postContainer = document.getElementById("posts");
        const post = document.createElement("div");
        post.classList.add("post");

        const itemName = document.createElement("h4");
        itemName.textContent = invData.descriptions[0].name;

        const itemImage = document.createElement("img");;
        itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[0].icon_url}`;
        
        const itemPrice = document.createElement("h6");
        itemPrice.textContent = "50Vbux";

        post.append(itemName, itemImage, itemPrice);
        postContainer.append(post);
}

main();