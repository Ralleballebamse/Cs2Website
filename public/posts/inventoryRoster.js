export function buildInventoryRoster(ownSteamId, matchSteamIds) {
    return [...new Set([ownSteamId, ...(matchSteamIds || [])].filter(id => typeof id === "string" && /^\d{17}$/.test(id)))];
}
