export function initHtmlButtons(deps) {
    const {
        steamProfileButtonAll,
        sortItemsByHighPriceToLow,
        sortItemsByLowPriceToHigh,
        searchForSkins,
        switchToMain,
        priceHighTextArea,
        containers,
        normalPostContainer,
        itemUserDecidePriceContainer,
        sortItemsByHighPriceToLowFunction,
        sortOutLowAndHighPrices,
        displayVisibleOrHidden,
        state
    } = deps;

    steamProfileButtonAll.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        const buttons = steamProfileButtonAll.querySelectorAll("button");

        state.indexPlayerInv = Array.from(buttons).indexOf(btn);
        state.showSpecifiedPlayerInv = true;

        checkActiveFunctions();
    });

    sortItemsByHighPriceToLow.addEventListener("click", () => {
        state.highToLow = true;
        state.lowToHigh = false;
        checkActiveFunctions();
    });

    sortItemsByLowPriceToHigh.addEventListener("click", () => {
        state.lowToHigh = true;
        state.highToLow = false;
        checkActiveFunctions();
    });

    switchToMain.addEventListener("click", () => {
        state.showSpecifiedPlayerInv = false;
        checkActiveFunctions();
    });

    priceHighTextArea.addEventListener("keydown", (e) => {
        const allowed = [
            "Backspace", "Delete", "ArrowLeft", "ArrowRight",
            "ArrowUp", "ArrowDown", "Tab", "Enter"
        ];

        if (!/^[0-9]$/.test(e.key) && !allowed.includes(e.key)) {
            e.preventDefault();
        }
    });

    priceHighTextArea.addEventListener("input", () => {
        state.heighestPrice = priceHighTextArea[0].value;
        state.minimunPrice = priceHighTextArea[1].value;

        const high = state.heighestPrice;
        const low = state.minimunPrice;
        state.followPriceRange = !(high === "" && low === "");

        checkActiveFunctions();
    });

    searchForSkins.addEventListener("keydown", (e) => {
        const allowed = [
            "Backspace", "Delete", "ArrowLeft", "ArrowRight",
            "ArrowUp", "ArrowDown", "Tab", "Enter"
        ];

        if (!/^[a-zA-Z0-9 ]$/.test(e.key) && !allowed.includes(e.key)) {
            e.preventDefault();
        }
    });

    searchForSkins.addEventListener("input", () => {
        state.searchItemName = searchForSkins.value;
        checkActiveFunctions();
    });

    function checkActiveFunctions() {
        // 1) Choose container
        const baseContainer =
            state.showSpecifiedPlayerInv && containers[state.indexPlayerInv]
                ? containers[state.indexPlayerInv]
                : normalPostContainer;

        // 2) Apply price filter
        let activeContainer = baseContainer;

        if (state.followPriceRange) {
            sortOutLowAndHighPrices(state.heighestPrice, state.minimunPrice, baseContainer);
            activeContainer = itemUserDecidePriceContainer;
        }

        // 3) Apply search
        searchItemsByName(state.searchItemName || "", activeContainer, state.searchItem);

        // 4) Apply sort
        if (state.highToLow) {
            sortItemsByHighPriceToLowFunction("highToLow", activeContainer);
        } else if (state.lowToHigh) {
            sortItemsByHighPriceToLowFunction("lowToHigh", activeContainer);
        }

        // 5) Final container
        displayVisibleOrHidden(activeContainer);

        state.lastShown = activeContainer;
    }
}
