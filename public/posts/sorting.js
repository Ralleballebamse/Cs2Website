export function initSorting(deps) {
    const {
        state,
        normalPostContainer,
        itemUserDecidePriceContainer,
        displayVisibleOrHidden
    } = deps;

    function sortOutLowAndHighPrices(highValue, lowValue, container) {
        if (highValue === "") highValue = 10000;
        if (lowValue === "") lowValue = 0;

        const posts = Array.from(container.querySelectorAll(".post"));
        itemUserDecidePriceContainer.innerHTML = "";

        posts.forEach(post => {
            const priceA = parseFloat(
                post.querySelector("h6").textContent.replace(/[^0-9.]/g, "")
            );
            if (priceA >= lowValue && priceA <= highValue) {
                itemUserDecidePriceContainer.appendChild(post.cloneNode(true));
            }
        });

        if (state.highToLow) {
            sortItemsByHighPriceToLowFunction("highToLow", itemUserDecidePriceContainer);
        } else if (state.lowToHigh) {
            sortItemsByHighPriceToLowFunction("lowToHigh", itemUserDecidePriceContainer);
        }

        state.followPriceRange = !(highValue === 10000 && lowValue === 0);

        displayVisibleOrHidden(itemUserDecidePriceContainer);
    }

    function sortItemsByHighPriceToLowFunction(sort, container) {
        if ((container.querySelectorAll("div").length) === 0) {
            container = normalPostContainer;
        }

        displayVisibleOrHidden(container);

        const posts = Array.from(container.querySelectorAll(".post"));
        posts.sort((a, b) => {
            const priceA = parseFloat(
                a.querySelector("h6").textContent.replace(/[^0-9.]/g, "")
            );
            const priceB = parseFloat(
                b.querySelector("h6").textContent.replace(/[^0-9.]/g, "")
            );

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
