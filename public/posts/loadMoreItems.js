export async function loadMoreItems(invData, containerPerSteamAccount, deps) {
	const {
		arrayAssets,
		normalPostContainer,
		mainContainer,
		fetchData
	} = deps;

	function createItemInspectLink(assetid, steamid, link) {
		return link
			.replace("%owner_steamid%", steamid)
			.replace("%assetid%", assetid);
	}

	const descByClass = new Map(
		invData.descriptions.map(d => [d.classid, d])
	);
	const propsByAssetId = new Map(
		invData.asset_properties.map(ap => [ap.assetid, ap.asset_properties])
	);

	console.log(invData);

	for (let z = 0; z < 5; z++) { // invData.assets.length
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
		let nameContains = desc.name
			.replace("★ ", "")
			.replace(" | ", " ");

		itemName.textContent = nameContains;

		const itemWear = document.createElement("h5");
		itemWear.textContent = desc.market_name.split("(")[1]?.replace(")", "") || "Unknown";

		const itemFloat = document.createElement("h5");
		const props = propsByAssetId.get(asset.assetid);
		const floatValue = props?.find(p => p.name === "Wear Rating")?.float_value;

		itemFloat.textContent = floatValue ?? "";

		const itemImage = document.createElement("img");
		itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url ?? ""}`;

		const itemPrice = document.createElement("h6");

		try {
			itemPrice.textContent = `Market value : ${await fetchData(desc.market_hash_name, "$")}`;
		} catch {
			itemPrice.textContent = "Market value : $0.01";
		}

		post.append(itemName, itemWear, itemFloat, itemImage, itemPrice);

		normalPostContainer.append(post);
		containerPerSteamAccount.append(post.cloneNode(true));
	}

	mainContainer.append(containerPerSteamAccount);
}
