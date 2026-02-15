// htmlButtons.js

export function initHtmlButtons(deps) {
    const {
        steamProfileButtonAll,
        sortItemsByHighPriceToLow,
        sortItemsByLowPriceToHigh,
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

        if (state.highToLow) {
            sortItemsByHighPriceToLowFunction("highToLow", containers[state.indexPlayerInv]);
        } else if (state.lowToHigh) {
            sortItemsByHighPriceToLowFunction("lowToHigh", containers[state.indexPlayerInv]);
        }

        if (state.followPriceRange) {
            sortOutLowAndHighPrices(
                state.heighestPrice,
                state.minimunPrice,
                containers[state.indexPlayerInv]
            );
        } else {
            displayVisibleOrHidden(containers[state.indexPlayerInv]);
        }
    });

    sortItemsByHighPriceToLow.addEventListener("click", () => {
        if (state.followPriceRange) {
            sortItemsByHighPriceToLowFunction("highToLow", itemUserDecidePriceContainer);
        } else if (state.showSpecifiedPlayerInv) {
            sortItemsByHighPriceToLowFunction("highToLow", containers[state.indexPlayerInv]);
        } else {
            sortItemsByHighPriceToLowFunction("highToLow", normalPostContainer);
        }
    });

    sortItemsByLowPriceToHigh.addEventListener("click", () => {
        if (state.followPriceRange) {
            sortItemsByHighPriceToLowFunction("lowToHigh", itemUserDecidePriceContainer);
        } else if (state.showSpecifiedPlayerInv) {
            sortItemsByHighPriceToLowFunction("lowToHigh", containers[state.indexPlayerInv]);
        } else {
            sortItemsByHighPriceToLowFunction("lowToHigh", normalPostContainer);
        }
    });

    switchToMain.addEventListener("click", () => {
        state.showSpecifiedPlayerInv = false;
        displayVisibleOrHidden(normalPostContainer);
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

        if (state.showSpecifiedPlayerInv) {
            sortOutLowAndHighPrices(
                state.heighestPrice,
                state.minimunPrice,
                containers[state.indexPlayerInv]
            );
        } else {
            sortOutLowAndHighPrices(
                state.heighestPrice,
                state.minimunPrice,
                normalPostContainer
            );
        }
    });
}
