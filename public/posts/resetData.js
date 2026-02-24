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

    profileContainer.innerHTML = "";
    normalPostContainer.innerHTML = "";
    itemSortContainer.innerHTML = "";
    itemUserDecidePriceContainer.innerHTML = "";

    containers.length = 0;

    arrayAssets.length = 0;

    state.showSpecifiedPlayerInv = false;
    state.indexPlayerInv = 0;
    state.followPriceRange = false;
    state.highToLow = false;
    state.lowToHigh = false;
    state.heighestPrice = 0;
    state.minimunPrice = 0;

    displayVisibleOrHidden(normalPostContainer);
}