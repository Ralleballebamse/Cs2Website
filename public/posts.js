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
    console.log(invData.descriptions[0].icon_url);
    const imgUrl = `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[0].icon_url}`;
    for (let i = 0; i <= invData.descriptions.length-1; i++) {
        //console.log(invData.descriptions[i].name);
    }
    console.log(
        "Image:",
        `https://community.cloudflare.steamstatic.com/economy/image/${invData.descriptions[0].icon_url}`
    );
}

main();