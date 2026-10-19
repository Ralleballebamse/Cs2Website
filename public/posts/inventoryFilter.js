const GUN_TYPES = new Set([
    "CSGO_Type_Pistol", "CSGO_Type_Rifle", "CSGO_Type_SMG",
    "CSGO_Type_Shotgun", "CSGO_Type_SniperRifle", "CSGO_Type_Machinegun",
]);

export function isDefaultWeapon(description) {
    const tags = description.tags || [];
    const weapon = tags.find(tag => tag.category === "Weapon")?.internal_name;
    const name = description.market_hash_name || description.market_name || description.name || "";

    if (weapon === "weapon_c4" || name.trim() === "C4 Explosive") return true;
    if ((weapon === "weapon_taser" || name.trim() === "Zeus x27") && !name.includes(" | ")) return true;

    // The standard T/CT knives are distinct from purchasable vanilla knives.
    if (weapon === "weapon_knife" || weapon === "weapon_knife_t") return true;
    if (/^(?:Knife|Knife \(T\)|Knife \(CT\)|T Knife|CT Knife)$/.test(name.trim())) return true;

    // A star marks special knives, including vanilla Karambit/Bayonet/etc.
    if (name.includes("★") || tags.some(tag => tag.internal_name === "CSGO_Type_Knife")) return false;

    const gun = tags.some(tag => GUN_TYPES.has(tag.internal_name)) ||
        /\b(?:Pistol|Rifle|SMG|Shotgun|Machinegun|Machine Gun)\b/i.test(description.type || "");
    return gun && !name.includes(" | ");
}
