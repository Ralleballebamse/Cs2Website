export function readFloat(post) {
    return post.dataset.float === undefined ? NaN : Number(post.dataset.float);
}

export function matchesFloatRange(value, low, high) {
    const minimum = low === "" ? 0 : Number(low.replace(",", "."));
    const maximum = high === "" ? 1 : Number(high.replace(",", "."));
    return Number.isFinite(value) && minimum >= 0 && maximum <= 1 &&
        value >= minimum && value <= maximum;
}

export function initSorting(deps) {
    const {
        state,
        normalPostContainer,
        itemUserDecidePriceContainer,
        displayVisibleOrHidden
    } = deps;

    function sortOutLowAndHighPrices(highValue, lowValue, container) {
        if (highValue === "") highValue = Infinity;
        if (lowValue === "") lowValue = 0;

        const posts = Array.from(container.querySelectorAll(".post"));
        itemUserDecidePriceContainer.innerHTML = "";

        posts.forEach(post => {
            const priceA = parseFloat(
                post.querySelector("h6").textContent.replace("+", "").replace(",", ".").replace(/[^0-9.]/g, "")
            );
            const matchesPrice = !state.followPriceRange || (priceA >= lowValue && priceA <= highValue);
            const matchesFloat = !state.followFloatRange || matchesFloatRange(readFloat(post), state.lowestFloat, state.highestFloat);
            if (matchesPrice && matchesFloat) {
                itemUserDecidePriceContainer.appendChild(post.cloneNode(true));
            }
        });

        if (state.highToLow) {
            sortItemsByHighPriceToLowFunction("highToLow", itemUserDecidePriceContainer);
        } else if (state.lowToHigh) {
            sortItemsByHighPriceToLowFunction("lowToHigh", itemUserDecidePriceContainer);
        }

        displayVisibleOrHidden(itemUserDecidePriceContainer);
    }

    function sortItemsByHighPriceToLowFunction(sort, container) {
        displayVisibleOrHidden(container);

        const posts = Array.from(container.querySelectorAll(".post"));
        posts.sort((a, b) => {
            const priceA = state.sortMetric === "float" ? readFloat(a) : parseFloat(
                a.querySelector("h6").textContent.replace("+", "").replace(",", ".").replace(/[^0-9.]/g, "")
            );
            const priceB = state.sortMetric === "float" ? readFloat(b) : parseFloat(
                b.querySelector("h6").textContent.replace("+", "").replace(",", ".").replace(/[^0-9.]/g, "")
            );

            if (!Number.isFinite(priceA)) return Number.isFinite(priceB) ? 1 : 0;
            if (!Number.isFinite(priceB)) return -1;
            if (sort === "highToLow") {
                state.highToLow = true;
                state.lowToHigh = false;
                return priceB - priceA;
            } else if (sort === "lowToHigh") {
                state.lowToHigh = true;
                state.highToLow = false;
                return priceA - priceB;
            }

            return 0;
        });

        container.innerHTML = "";
        posts.forEach(post => container.appendChild(post.cloneNode(true)));
    }


    function searchItemsByName(query, container, searchingAfterName) {
        const value = (query || "").toLowerCase();
        const posts = Array.from(container.querySelectorAll(".post"));

        posts.forEach(post => {
            let title = (post.querySelector("h4")?.textContent || "").toLowerCase();

            if (title.startsWith("stattrak™")){
                title = title.replace("stattrak™ ", "");
            } else if (title.startsWith("souvenir")){
                title = title.replace("souvenir ", "");
            }
            
            post.style.display = title.startsWith(value) ? "" : "none";
        });
    }


    return {
        sortOutLowAndHighPrices,
        sortItemsByHighPriceToLowFunction,
        searchItemsByName,
    };
}
