export function resetForNewMatch(deps) {
    const {
        profileContainer,
        normalPostContainer,
        itemSortContainer,
        itemUserDecidePriceContainer,
        containers,
        arrayAssets,
        state,
        displayVisibleOrHidden,
    } = deps;

    // Clear DOM
    profileContainer.innerHTML = "";
    normalPostContainer.innerHTML = "";
    itemSortContainer.innerHTML = "";
    itemUserDecidePriceContainer.innerHTML = "";

    // Clear containers list
    containers.length = 0;

    // Clear array assets (keep same array reference!)
    arrayAssets.length = 0;

    // Reset state
    state.showSpecifiedPlayerInv = false;
    state.indexPlayerInv = 0;
    state.followPriceRange = false;
    state.highToLow = false;
    state.lowToHigh = false;
    state.heighestPrice = 0;
    state.minimunPrice = 0;

    displayVisibleOrHidden(normalPostContainer);
}