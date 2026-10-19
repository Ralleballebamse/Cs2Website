import { requestMarketPrices } from "./marketPrices.js";
import { isDefaultWeapon } from "./inventoryFilter.js";
export async function loadMoreItems(invData, containerPerSteamAccount, deps) {
	const { arrayAssets, normalPostContainer, mainContainer, steamid } = deps;

	function showInventoryMessage(message) {
		const privateMessage = document.createElement("div");
		privateMessage.classList.add("inventory-message");
		privateMessage.textContent = message;
		containerPerSteamAccount.append(privateMessage);
	}

	const errorMessage = `${invData?.error ?? invData?.Error ?? ""}`.toLowerCase();
	const isPrivateInventory =
		invData?.privateInventory ||
		invData?.status === 401 ||
		invData?.status === 403 ||
		errorMessage.includes("private") ||
		errorMessage.includes("not allowed") ||
		errorMessage.includes("forbidden") ||
		errorMessage.includes("unavailable");

	if (isPrivateInventory) {
		console.log(`${containerPerSteamAccount.dataset.playerName || steamid} private inventory`);
		showInventoryMessage("This player's CS2 inventory is private.");
		mainContainer.append(containerPerSteamAccount);
		return;
	}

	if (invData?.status === 429) {
		showInventoryMessage("Steam is rate limiting inventory requests. Try again in a minute.");
		mainContainer.append(containerPerSteamAccount);
		return;
	}

	if (!Array.isArray(invData?.descriptions) || !Array.isArray(invData?.assets)) {
		showInventoryMessage("Could not load this player's CS2 inventory.");
		mainContainer.append(containerPerSteamAccount);
		return;
	}

	const assetProperties = Array.isArray(invData.asset_properties) ? invData.asset_properties : [];
	const descByClass = new Map(invData.descriptions.map((d) => [d.classid, d]));
	const propsByAssetId = new Map(
		assetProperties.map((ap) => [ap.assetid, ap.asset_properties])
	);

	for (let z = 0; z < invData.assets.length; z++) { //invData.assets.length
		const asset = invData.assets[z];
		const classid = asset?.classid;
		if (!classid) continue;

		const desc = descByClass.get(classid);
		if (!desc) continue;
		if (isDefaultWeapon(desc)) continue;

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
		if (floatValue != null && Number.isFinite(Number(floatValue))) {
			post.dataset.float = String(floatValue);
			itemFloat.textContent = Number(floatValue).toFixed(7);
		} else itemFloat.textContent = "Float unavailable";

		// --- image ---
		const itemImage = document.createElement("img");
		itemImage.src = `https://community.cloudflare.steamstatic.com/economy/image/${desc.icon_url ?? ""}`;

		// --- price ---
		const itemPrice = document.createElement("h6");
		const marketName = desc.marketable === 0 ? null : desc.market_hash_name;
		itemPrice.textContent = marketName ? "Market value : loading" : "Market value : unavailable";
		if (marketName) itemPrice.dataset.marketName = marketName;
		post.append(itemName, itemWear, itemImage, itemFloat, itemPrice);
		normalPostContainer.append(post);
		containerPerSteamAccount.append(post.cloneNode(true));
	}

	mainContainer.append(containerPerSteamAccount);
	requestMarketPrices();
}
