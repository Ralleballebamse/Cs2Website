export async function loadMoreItems(invData, containerPerSteamAccount, deps) {
	const { arrayAssets, normalPostContainer, mainContainer, fetchweaponNameId, fetchPrice } = deps;

	function createItemInspectLink(assetid, steamid, link) {
		return link.replace("%owner_steamid%", steamid).replace("%assetid%", assetid);
	}

	const descByClass = new Map(invData.descriptions.map((d) => [d.classid, d]));
	const propsByAssetId = new Map(
		invData.asset_properties.map((ap) => [ap.assetid, ap.asset_properties])
	);

	for (let z = 0; z < invData.assets.length; z++) { //invData.assets.length
		const asset = invData.assets[z];
		const classid = asset?.classid;
		if (!classid) continue;

		const desc = descByClass.get(classid);
		if (!desc) continue;

		const exclude = desc.tags?.some(
			(tag) =>
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

		const cleanName = desc.name.replace("★ ", "");
		const parts = cleanName.split(" | ");

		let weaponPart = parts[0] ?? "";
		let namePart = parts[1] ?? "";

		const weaponSouvenir = weaponPart.includes("Souvenir");
		const weaponStattrak = weaponPart.includes("StatTrak™");

		weaponPart = weaponPart
			.replace("Souvenir ", "")
			.replace("StatTrak™ ", "")
			.trim();

		let weaponName = weaponPart;
		let weaponSkin = namePart;

		if (weaponPart.endsWith(" Case")) {
			weaponName = "Case";
			weaponSkin = weaponPart.replace(/ Case$/, "").trim();
		}

		itemName.textContent = `${weaponName} ${weaponSkin}`.trim();

		// --- wear ---
		const itemWear = document.createElement("h5");
		const wear = desc.market_name.split("(")[1]?.replace(")", "") || "Unknown";
		itemWear.textContent = wear;

		// --- float ---
		const itemFloat = document.createElement("h5");
		const props = propsByAssetId.get(asset.assetid);
		const floatValue = props?.find((p) => p.name === "Wear Rating")?.float_value;
		itemFloat.textContent = Number(floatValue).toFixed(7);

		// --- image ---
		const itemImage = document.createElement("img");
		itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url ?? ""}`;

		// --- price ---
		const itemPrice = document.createElement("h6");
		let marketID;

		// DB price/date
		let dbRow = null;
		try {
			const res = await fetch("/api/mysql/marketId/get", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					weapon: weaponName,
					name: weaponSkin,
					condition: wear,
					stattrak: weaponStattrak,
					souvenir: weaponSouvenir,
				}),
			});
			dbRow = await res.json();
		} catch {
			dbRow = null;
		}

		marketID = dbRow?.marketID ?? null;

		//if marketID doesn´t exist
		if (marketID === null) {
			try {
				const itemName = `${weaponName} | ${weaponSkin} (${wear})`;
				marketID = await fetchweaponNameId(itemName);
			} catch (err) {
				console.log("marketId fetch error : " + err);
			}

			// Save to DB
			try {
				await fetch("/api/mysql/marketId/set", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						marketID: marketID,
						weapon: weaponName,
						name: weaponSkin,
						condition: wear,
						stattrak: weaponStattrak,
						souvenir: weaponSouvenir,
					}),
				});
			} catch (err) {
				console.log("Save to DB error : " + err);
			}
		}

		try {
			const weaponPrice = await fetchPrice(marketID, "€");
			itemPrice.textContent = `Market value : ${weaponPrice}`;
		} catch (err) {
			console.log("fetch price error : " + err);
		}


		post.append(itemName, itemWear, itemImage, itemFloat, itemPrice);
		normalPostContainer.append(post);
		containerPerSteamAccount.append(post.cloneNode(true));
	}

	mainContainer.append(containerPerSteamAccount);
}