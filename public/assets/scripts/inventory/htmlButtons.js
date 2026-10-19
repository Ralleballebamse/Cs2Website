export function initHtmlButtons(deps) {
    const {
        steamProfileButtonAll,
        sortItemsByHighPriceToLow,
        sortItemsByLowPriceToHigh,
        sortItemsByHighFloatToLow,
        sortItemsByLowFloatToHigh,
        floatRangeForm,
        searchForSkins,
        switchToMain,
        priceHighTextArea,
        containers,
        normalPostContainer,
        itemUserDecidePriceContainer,
        sortItemsByHighPriceToLowFunction,
        searchItemsByName,
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
        state.sortMetric = "price";
        state.highToLow = true;
        state.lowToHigh = false;
        checkActiveFunctions();
    });

    sortItemsByLowPriceToHigh.addEventListener("click", () => {
        state.sortMetric = "price";
        state.lowToHigh = true;
        state.highToLow = false;
        checkActiveFunctions();
    });

    sortItemsByHighFloatToLow.addEventListener("click", () => {
        state.sortMetric = "float";
        state.highToLow = true;
        state.lowToHigh = false;
        checkActiveFunctions();
    });

    sortItemsByLowFloatToHigh.addEventListener("click", () => {
        state.sortMetric = "float";
        state.lowToHigh = true;
        state.highToLow = false;
        checkActiveFunctions();
    });

    floatRangeForm.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.key.length > 1) return;
        if (!/^[0-9.,]$/.test(e.key)) e.preventDefault();
    });
    floatRangeForm.addEventListener("submit", e => e.preventDefault());
    floatRangeForm.addEventListener("input", () => {
        state.highestFloat = document.getElementById("FloatHigh").value.trim();
        state.lowestFloat = document.getElementById("FloatLow").value.trim();
        state.followFloatRange = state.highestFloat !== "" || state.lowestFloat !== "";
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

        if (state.followPriceRange || state.followFloatRange) {
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
