import { loadMoreItems } from "./loadMoreItems.js";
import { initHtmlButtons } from "./htmlButtons.js";
import { initSorting } from "./sorting.js";
import { initSteamInfo } from "./steamInfo.js";
import { startFaceitWatcher } from "./faceitWatcher.js";
import { resetForNewMatch } from "./resetData.js";

async function loadfiles(link) {
    try {
        const response = await fetch(link);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error loading file:", err);
    }
}


async function main() {
    //Declared globally variables
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); // This is for making an await sleep
    const arrayAssets = []; // Array for avoiding dublications of items
    let steamIds = [];

    const state = {
        heighestPrice: 0,
        minimunPrice: 0,
        followPriceRange: false,
        lowToHigh: false,
        highToLow: false,
        showSpecifiedPlayerInv: false,
        indexPlayerInv: 0,
        searchItem: false,
        searchItemName: "",
        lastShown: null
    };


    //Containers
    const containers = [];
    const mainContainer = document.getElementById("mainContainer");
    const steamProfileButtonAll = document.getElementById("multipleProfileButtons")

    const normalPostContainer = document.getElementById("posts");
    const itemSortContainer = document.getElementById("sortedPosts");
    const itemUserDecidePriceContainer = document.getElementById("sortedPosts");

    state.lastShown = normalPostContainer;

    //ElementbyIds
    const sortItemsByHighPriceToLow = document.getElementById("sortItemsByHighPriceToLowBtn");
    const sortItemsByLowPriceToHigh = document.getElementById("sortItemsByLowPriceToHighBtn");
    const switchToMain = document.getElementById("switchToMain");
    const priceHighTextArea = document.getElementById("PriceToPrice");
    const searchForSkins = document.getElementById("SearchForSkinsTextArea");

    //Css changes
    itemSortContainer.style.display = "none";
    itemUserDecidePriceContainer.style.display = "none";


    const { loadInSteamData, fetchSteamId, fetchweaponNameId, fetchPrice } = initSteamInfo({
        sleep,
        loadfiles,
        containers,
        mainContainer
    });


    const { sortOutLowAndHighPrices, sortItemsByHighPriceToLowFunction, searchItemsByName } = initSorting({
        state,
        normalPostContainer,
        itemUserDecidePriceContainer,
        displayVisibleOrHidden
    });


    initHtmlButtons({
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
        searchItemsByName,
        state
    });


    function displayVisibleOrHidden(show) {
        if (!show) return;

        if (state.lastShown && state.lastShown !== show) {
            state.lastShown.style.display = "none";
        }

        show.style.display = "grid";
        state.lastShown = show;
    }


    resetForNewMatch({
        profileContainer: document.getElementById("multipleProfileButtons"),
        normalPostContainer,
        itemSortContainer,
        itemUserDecidePriceContainer,
        containers,
        arrayAssets,
        state,
        displayVisibleOrHidden,
    });


    startFaceitWatcher({
        sleep,
        pollMs: 2000,
        onNewSteamIds: async ({ steamIds: ids }) => {
            steamIds = ids || [];

            resetForNewMatch({
                profileContainer: document.getElementById("multipleProfileButtons"),
                normalPostContainer,
                itemSortContainer,
                itemUserDecidePriceContainer,
                containers,
                arrayAssets,
                state,
                displayVisibleOrHidden,
            });

            await runAndStream();
        },
    });


    async function runAndStream() {
        console.log("Starting all tasks...\n");

        for (let i = 0; i < steamIds.length; i++) {
            const steamid = steamIds[i];

            // Start the async work
            const steamdata = await loadInSteamData(steamid);
            const ContainerPerSteamAccount = await fetchSteamId(steamid);

            const promise = loadMoreItems(steamdata, ContainerPerSteamAccount, {
                arrayAssets,
                normalPostContainer,
                mainContainer,
                fetchweaponNameId,
                fetchPrice
            });

            // Attach a handler for WHEN it finishes
            promise.then(result => {
                console.log("STREAM:", result);
            });
        }
        console.log("\nAll tasks have been started (but not finished yet)");
    }

    const dropdown = document.getElementById("sortDropdown");
    const mainBtn = dropdown.querySelector(".dropbtn");
    const label = dropdown.querySelector(".label");
    const options = dropdown.querySelectorAll(".dropdown-content button");

    // toggle open/close
    mainBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    });

    // when picking an option, rename the main button + close
    options.forEach(btn => {
        btn.addEventListener("click", () => {
            label.textContent = btn.textContent;
            dropdown.classList.remove("open");
        });
    });

    // click outside closes
    document.addEventListener("click", () => dropdown.classList.remove("open"));

    // esc closes
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dropdown.classList.remove("open");
    });
}

main();